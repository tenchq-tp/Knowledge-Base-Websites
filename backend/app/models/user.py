from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, Enum, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import INET, UUID
from app.db.database import Base
from pydantic import BaseModel
import enum
import random
import hashlib
import uuid

class UserRole(str, enum.Enum):
    USER = "user"
    MODERATOR = "moderator"

class GenderType(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

def generate_user_id():
    """Generate random 10-digit ID"""
    return random.randint(1000000000, 9999999999)

def hash_token(token: str) -> str:
    """Hash token using SHA-256"""
    return hashlib.sha256(token.encode()).hexdigest()

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, default=generate_user_id)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)  # bcrypt/scrypt/argon2 hashed
    role = Column(Enum(UserRole), default=UserRole.USER, index=True)
    is_verified = Column(Boolean, default=False, index=True)
    last_login = Column(DateTime(timezone=True), index=True)
    
    # Audit fields (NULLABLE for first user)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_by = Column(BigInteger, ForeignKey('users.id'), nullable=True)
    modified_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    modified_by = Column(BigInteger, ForeignKey('users.id'), nullable=True)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", foreign_keys="[UserProfile.user_id]")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    setting = relationship("UserSetting", back_populates="user", uselist=False)

    # Self-referential relationships for audit (nullable)
    creator = relationship("User", foreign_keys=[created_by], remote_side=[id], post_update=True)
    modifier = relationship("User", foreign_keys=[modified_by], remote_side=[id], post_update=True)

    def verify_password(self, password: str) -> bool:
        """Verify password against stored hash"""
        from app.core.security import verify_password
        return verify_password(password, self.password)

    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = func.now()

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(BigInteger, primary_key=True)  # Same as user.id
    user_id = Column(BigInteger, ForeignKey('users.id'), unique=True, nullable=False)
    
    # Personal information
    title = Column(String(50))  # Mr., Ms., Dr., etc.
    first_name = Column(String(50), index=True)
    last_name = Column(String(50), index=True)
    phone = Column(String(20))
    date_of_birth = Column(Date)
    gender = Column(Enum(GenderType), index=True)  # ENUM for data integrity
    
    # Location
    country = Column(String(50), index=True)
    city = Column(String(50), index=True)
    address = Column(Text)
    
    # Audit fields (NULLABLE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(BigInteger, ForeignKey('users.id'), nullable=True)
    modified_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    modified_by = Column(BigInteger, ForeignKey('users.id'), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="profile", foreign_keys=[user_id])
    creator = relationship("User", foreign_keys=[created_by], remote_side=[User.id], post_update=True)
    modifier = relationship("User", foreign_keys=[modified_by], remote_side=[User.id], post_update=True)

    @property
    def full_name(self) -> str:
        """Get full name from first and last name"""
        parts = []
        if self.first_name:
            parts.append(self.first_name)
        if self.last_name:
            parts.append(self.last_name)
        return " ".join(parts) or "Unknown"

    @property
    def display_name(self) -> str:
        """Get display name with title if available"""
        if self.title and self.first_name:
            return f"{self.title} {self.first_name}"
        elif self.first_name:
            return self.first_name
        else:
            return "User"

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(BigInteger, ForeignKey('users.id'), nullable=False, index=True)
    
    # Hashed tokens (NOT plain JWT!)
    session_token_hash = Column(String(255), nullable=False, index=True)  # SHA-256 hash
    refresh_token_hash = Column(String(255), index=True)  # SHA-256 hash
    
    # Session metadata
    device_info = Column(Text)
    ip_address = Column(INET, index=True)
    user_agent = Column(Text)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    refresh_expires_at = Column(DateTime(timezone=True))  # Separate expiry for refresh token
    is_active = Column(Boolean, default=True, index=True)
    
    # Simplified audit (no created_by/modified_by as suggested)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    modified_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="sessions")

    @classmethod
    def create_session(cls, user_id: int, session_token: str, refresh_token: str = None, 
                      device_info: str = None, ip_address: str = None, user_agent: str = None,
                      session_expires_minutes: int = 30, refresh_expires_hours: int = 168):
        """Create new session with hashed tokens"""
        from datetime import datetime, timedelta
        
        return cls(
            user_id=user_id,
            session_token_hash=hash_token(session_token),
            refresh_token_hash=hash_token(refresh_token) if refresh_token else None,
            device_info=device_info,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=datetime.utcnow() + timedelta(minutes=session_expires_minutes),
            refresh_expires_at=datetime.utcnow() + timedelta(hours=refresh_expires_hours) if refresh_token else None
        )

    def validate_session_token(self, token: str) -> bool:
        """Validate session token against stored hash"""
        if not self.is_active:
            return False
        if self.expires_at and self.expires_at < func.now():
            return False
        return self.session_token_hash == hash_token(token)

    def validate_refresh_token(self, token: str) -> bool:
        """Validate refresh token against stored hash"""
        if not self.is_active or not self.refresh_token_hash:
            return False
        if self.refresh_expires_at and self.refresh_expires_at < func.now():
            return False
        return self.refresh_token_hash == hash_token(token)

    def invalidate(self):
        """Invalidate this session"""
        self.is_active = False