from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from typing import Optional, List
from datetime import datetime, timedelta
from app.models.user import User, UserProfile, UserSession
from app.models.role import Role
from app.schemas.user import UserCreate, UserProfileCreate, UserProfileUpdate, UserResponse
from app.core.security import get_password_hash, verify_password, generate_secure_token, hash_token
from fastapi import HTTPException

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).options(joinedload(User.profile)).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).options(joinedload(User.profile)).filter(User.username == username).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    user = db.query(User).options(joinedload(User.profile)).filter(User.id == user_id).first()
    if not user:
        return None

    active_session = (
        db.query(UserSession)
        .filter(UserSession.user_id == user.id, UserSession.is_active == True)
        .order_by(UserSession.created_at.desc())
        .first()
    )
    setattr(user, "is_active", bool(active_session))
    return user

def get_users_list(db: Session, skip: int = 0, limit: int = 100, 
                   role: Optional[str] = None, is_verified: Optional[bool] = None) -> List[User]:
    query = db.query(User).options(joinedload(User.profile))

    if role:
        query = query.filter(User.role == role)
    if is_verified is not None:
        query = query.filter(User.is_verified == is_verified)

    users = query.offset(skip).limit(limit).all()

    for user in users:
        active_session = (
            db.query(UserSession)
            .filter(UserSession.user_id == user.id, UserSession.is_active == True)
            .order_by(UserSession.created_at.desc())
            .first()
        )
        setattr(user, "is_active", bool(active_session))

    return users

def create_user(db: Session, user: UserCreate, created_by: Optional[int] = None):
    new_user = User(
        username=user.username,
        email=user.email,
        password=get_password_hash(user.password),
        role_id=user.role_id,
        is_verified=user.is_verified,
        created_by=created_by
    )

    db.add(new_user)
    db.flush()

    profile = UserProfile(
        user_id=new_user.id,
        title=user.profile.title,
        first_name=user.profile.first_name,
        last_name=user.profile.last_name,
        phone=user.profile.phone,
        date_of_birth=user.profile.date_of_birth,
        gender=user.profile.gender,
        country=user.profile.country,
        city=user.profile.city,
        address=user.profile.address,
        role_id=new_user.role_id 
    )
    db.add(profile)
    db.commit()
    db.refresh(new_user)
    return new_user

def update_user_profile(db: Session, user_id: int, profile_update: UserProfileUpdate, 
                       modified_by: Optional[int] = None) -> Optional[UserProfile]:
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
    user = get_user_by_username(db, username)
    if not user:
        user = get_user_by_email(db, username)
    
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    
    user.last_login = datetime.utcnow()
    db.commit()
    
    return user

def update_user_password(db: Session, user_id: int, new_password: str, 
                        modified_by: Optional[int] = None) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    
    user.password = get_password_hash(new_password)
    user.modified_by = modified_by
    db.commit()
    return True

def verify_user_email(db: Session, user_id: int, verified_by: Optional[int] = None) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    
    user.is_verified = True
    user.modified_by = verified_by
    db.commit()
    return True

def create_user_session(db: Session, user_id: int, device_info: str = None, ip_address: str = None, user_agent: str = None,
                        session_expires_minutes: int = 30, refresh_expires_hours: int = 168):
    session_token = generate_secure_token() 
    refresh_token = generate_secure_token() 

    old_session = db.query(UserSession).filter_by(user_id=user_id, is_active=True).first()

    if old_session:
        db.delete(old_session)
        db.commit()

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
    
    session.is_active = False
    session.refresh_expires_at = datetime.utcnow()
    session.modified_at = datetime.utcnow()
    
    new_session_token = generate_secure_token(32)
    new_refresh_token = generate_secure_token(32)
    
    new_session = UserSession(
        user_id=session.user_id,
        session_token_hash=hash_token(new_session_token),
        refresh_token_hash=hash_token(new_refresh_token),
        expires_at=datetime.utcnow() + timedelta(minutes=30),
        refresh_expires_at=datetime.utcnow() + timedelta(hours=168),
        is_active=True,
        created_at=datetime.utcnow(),
        modified_at=datetime.utcnow(),
    )
    db.add(new_session)
    db.commit()
    
    return new_session_token, new_refresh_token

def invalidate_session(db: Session, session_token: str) -> bool:
    token_hash = hash_token(session_token)
    session = db.query(UserSession).filter(UserSession.session_token_hash == token_hash).first()
    
    if session:
        session.invalidate()
        db.commit()
        return True
    return False

def invalidate_all_user_sessions(db: Session, user_id: int) -> int:
    count = db.query(UserSession).filter(
        and_(
            UserSession.user_id == user_id,
            UserSession.is_active == True
        )
    ).update({"is_active": False})
    
    db.commit()
    return count

def clean_expired_sessions(db: Session) -> int:
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

def update_user(db: Session, user_id: int, user_update: UserResponse, modified_by: Optional[int] = None) -> Optional[User]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    update_data = user_update.model_dump(exclude_unset=True)
    
    if "password" in update_data:
        user.password = get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(user, key, value)

    if "role_id" in update_data and user.profile:
        user.profile.role_id = update_data["role_id"]

    user.modified_by = modified_by
    db.commit()
    db.refresh(user)
    return user

