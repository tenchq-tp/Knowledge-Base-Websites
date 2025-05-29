from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from typing import Optional, List
from datetime import datetime, timedelta
from app.models.user import User, UserProfile, UserSession
from app.schemas.user import UserCreate, UserProfileCreate, UserProfileUpdate
from app.core.security import get_password_hash, verify_password, generate_secure_token, hash_token

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email with profile"""
    return db.query(User).options(joinedload(User.profile)).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username with profile"""
    return db.query(User).options(joinedload(User.profile)).filter(User.username == username).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID with profile"""
    return db.query(User).options(joinedload(User.profile)).filter(User.id == user_id).first()

def create_user(db: Session, user: UserCreate, created_by: Optional[int] = None) -> User:
    """Create new user with hashed password and auto-created profile"""
    hashed_password = get_password_hash(user.password)
    
    # Create user
    db_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password,
        role=user.role,
        created_by=created_by,
        modified_by=created_by
    )
    db.add(db_user)
    db.flush()  # Get the ID without committing
    
    # Create profile with same ID (trigger will handle this, but we can also do it manually)
    db_profile = UserProfile(
        id=db_user.id,
        user_id=db_user.id,
        created_by=created_by,
        modified_by=created_by
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_user)
    
    return db_user

def update_user_profile(db: Session, user_id: int, profile_update: UserProfileUpdate, 
                       modified_by: Optional[int] = None) -> Optional[UserProfile]:
    """Update user profile"""
    db_profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not db_profile:
        return None
    
    update_data = profile_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_profile, field, value)
    
    db_profile.modified_by = modified_by
    db.commit()
    db.refresh(db_profile)
    return db_profile

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user with username/email and password"""
    # Try username first, then email
    user = get_user_by_username(db, username)
    if not user:
        user = get_user_by_email(db, username)
    
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return user

def get_users_list(db: Session, skip: int = 0, limit: int = 100, 
                   role: Optional[str] = None, is_verified: Optional[bool] = None) -> List[User]:
    """Get list of users with filters"""
    query = db.query(User).options(joinedload(User.profile))
    
    if role:
        query = query.filter(User.role == role)
    if is_verified is not None:
        query = query.filter(User.is_verified == is_verified)
    
    return query.offset(skip).limit(limit).all()

def update_user_password(db: Session, user_id: int, new_password: str, 
                        modified_by: Optional[int] = None) -> bool:
    """Update user password with proper hashing"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    
    user.password = get_password_hash(new_password)
    user.modified_by = modified_by
    db.commit()
    return True

def verify_user_email(db: Session, user_id: int, verified_by: Optional[int] = None) -> bool:
    """Mark user email as verified"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    
    user.is_verified = True
    user.modified_by = verified_by
    db.commit()
    return True

# Session Management CRUD
def create_user_session(db: Session, user_id: int, device_info: Optional[str] = None,
                       ip_address: Optional[str] = None, user_agent: Optional[str] = None,
                       session_expires_minutes: int = 30, refresh_expires_hours: int = 168) -> tuple[UserSession, str, str]:
    """Create new session with secure tokens"""
    # Generate secure tokens
    session_token = generate_secure_token(32)
    refresh_token = generate_secure_token(32)
    
    # Create session with hashed tokens
    session = UserSession.create_session(
        user_id=user_id,
        session_token=session_token,
        refresh_token=refresh_token,
        device_info=device_info,
        ip_address=ip_address,
        user_agent=user_agent,
        session_expires_minutes=session_expires_minutes,
        refresh_expires_hours=refresh_expires_hours
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return session, session_token, refresh_token

def validate_session_token(db: Session, session_token: str) -> Optional[UserSession]:
    """Validate session token and return session if valid"""
    token_hash = hash_token(session_token)
    session = db.query(UserSession).filter(
        and_(
            UserSession.session_token_hash == token_hash,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.utcnow()
        )
    ).first()
    
    return session

def validate_refresh_token(db: Session, refresh_token: str) -> Optional[UserSession]:
    """Validate refresh token and return session if valid"""
    token_hash = hash_token(refresh_token)
    session = db.query(UserSession).filter(
        and_(
            UserSession.refresh_token_hash == token_hash,
            UserSession.is_active == True,
            UserSession.refresh_expires_at > datetime.utcnow()
        )
    ).first()
    
    return session

def refresh_user_session(db: Session, refresh_token: str) -> Optional[tuple[str, str]]:
    session = validate_refresh_token(db, refresh_token)
    if not session:
        return None
    
    # Revoke old session
    session.is_active = False
    session.refresh_expires_at = datetime.utcnow()  # หมดอายุ refresh token เดิมทันที
    session.modified_at = datetime.utcnow()
    
    # สร้าง token ใหม่
    new_session_token = generate_secure_token(32)
    new_refresh_token = generate_secure_token(32)
    
    # สร้าง session ใหม่ใน DB
    new_session = UserSession(
        user_id=session.user_id,
        session_token_hash=hash_token(new_session_token),
        refresh_token_hash=hash_token(new_refresh_token),
        expires_at=datetime.utcnow() + timedelta(minutes=30),
        refresh_expires_at=datetime.utcnow() + timedelta(hours=168),
        is_active=True,
        created_at=datetime.utcnow(),
        modified_at=datetime.utcnow(),
        # device_info, ip_address, user_agent ถ้ามี ให้ใส่ตามที่จำเป็น
    )
    db.add(new_session)
    db.commit()
    
    return new_session_token, new_refresh_token

def invalidate_session(db: Session, session_token: str) -> bool:
    """Invalidate specific session"""
    token_hash = hash_token(session_token)
    session = db.query(UserSession).filter(UserSession.session_token_hash == token_hash).first()
    
    if session:
        session.invalidate()
        db.commit()
        return True
    return False

def invalidate_all_user_sessions(db: Session, user_id: int) -> int:
    """Invalidate all sessions for a user"""
    count = db.query(UserSession).filter(
        and_(
            UserSession.user_id == user_id,
            UserSession.is_active == True
        )
    ).update({"is_active": False})
    
    db.commit()
    return count

def clean_expired_sessions(db: Session) -> int:
    """Clean expired sessions"""
    count = db.query(UserSession).filter(
        and_(
            UserSession.is_active == True,
            or_(
                UserSession.expires_at < datetime.utcnow(),
                UserSession.refresh_expires_at < datetime.utcnow()
            )
        )
    ).update({"is_active": False})
    
    db.commit()
    return count

def get_user_active_sessions(db: Session, user_id: int) -> List[UserSession]:
    """Get all active sessions for a user"""
    return db.query(UserSession).filter(
        and_(
            UserSession.user_id == user_id,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.utcnow()
        )
    ).all()
    
def delete_user(db: Session, user: User) -> User:
    db.delete(user)
    db.commit()
    return user