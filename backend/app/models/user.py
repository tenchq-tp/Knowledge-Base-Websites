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

class GenderType(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

def generate_user_id():
    return random.randint(1000000000, 9999999999)

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, default=generate_user_id)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False, index=True)
    last_login = Column(DateTime(timezone=True), index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_by = Column(BigInteger, ForeignKey('users.id'), nullable=True)
    modified_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    modified_by = Column(BigInteger, ForeignKey('users.id'), nullable=True)
    
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", foreign_keys="[UserProfile.user_id]")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    setting = relationship("UserSetting", back_populates="user", uselist=False)
    
    creator = relationship("User", foreign_keys=[created_by], remote_side=[id], post_update=True)
    modifier = relationship("User", foreign_keys=[modified_by], remote_side=[id], post_update=True)
    
    @property
    def role_name(self) -> str:
        return self.role.name if self.role else None

    def verify_password(self, password: str) -> bool:
        """Verify password against stored hash"""
        from app.core.security import verify_password
        return verify_password(password, self.password)

    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = func.now()

class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id = Column(BigInteger,ForeignKey('users.id', ondelete='CASCADE'),primary_key=True)
    title = Column(String(50)) 
    first_name = Column(String(50), index=True)
    last_name = Column(String(50), index=True)
    phone = Column(String(20))
    date_of_birth = Column(Date)
    gender = Column(Enum(GenderType), index=True)  
    role_id = Column(BigInteger, ForeignKey("roles.id"), index=True) # เพิ่ม nullable=False ให้ role_id ถ้าต้องการบังคับทุก user ต้องมี role
    
    country = Column(String(50), index=True)
    city = Column(String(50), index=True)
    address = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(BigInteger, ForeignKey('users.id'), nullable=True)
    modified_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    modified_by = Column(BigInteger, ForeignKey('users.id'), nullable=True)
    
    user = relationship("User", back_populates="profile", foreign_keys=[user_id])
    creator = relationship("User", foreign_keys=[created_by], remote_side=[User.id], post_update=True)
    modifier = relationship("User", foreign_keys=[modified_by], remote_side=[User.id], post_update=True)
    role = relationship("Role", viewonly=True)

    @property
    def role_name(self) -> str:
        return self.role.name if self.role else None

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
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    session_token_hash = Column(String(255), nullable=True, unique=True, index=True)  
    refresh_token_hash = Column(String(255), nullable=True, unique=True, index=True)  

    device_info = Column(Text, nullable=True)
    ip_address = Column(INET, nullable=True, index=True)
    user_agent = Column(Text, nullable=True)

    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    refresh_expires_at = Column(DateTime(timezone=True), nullable=True)

    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    modified_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="sessions")

    @classmethod
    def create_session(cls, user_id: int, session_token: str, refresh_token: str = None, 
                       device_info: str = None, ip_address: str = None, user_agent: str = None,
                       session_expires_minutes: int = 30, refresh_expires_hours: int = 168):
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
        if not self.is_active:
            return False
        from datetime import datetime
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        return self.session_token_hash == hash_token(token)

    def validate_refresh_token(self, token: str) -> bool:
        if not self.is_active or not self.refresh_token_hash:
            return False
        from datetime import datetime
        if self.refresh_expires_at and self.refresh_expires_at < datetime.utcnow():
            return False
        return self.refresh_token_hash == hash_token(token)

    def invalidate(self):
        self.is_active = False
       