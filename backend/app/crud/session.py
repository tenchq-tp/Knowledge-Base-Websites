from sqlalchemy.orm import Session
from datetime import datetime
from app.models.session import UserSession
from app.core.security import hash_token

def create_user_session(db: Session, user_id: int, session_token: str, refresh_token: str, expires_at: datetime, refresh_expires_at: datetime, device_info=None, ip_address=None, user_agent=None) -> UserSession:
    session_token_hash = hash_token(session_token)
    refresh_token_hash = hash_token(refresh_token)
    user_session = UserSession(
        user_id=user_id,
        session_token_hash=session_token_hash,
        refresh_token_hash=refresh_token_hash,
        expires_at=expires_at,
        refresh_expires_at=refresh_expires_at,
        device_info=device_info,
        ip_address=ip_address,
        user_agent=user_agent,
        is_active=True
    )
    db.add(user_session)
    db.commit()
    db.refresh(user_session)
    return user_session

def get_session_by_token(db: Session, token: str) -> UserSession | None:
    token_hash = hash_token(token)
    return db.query(UserSession).filter(UserSession.session_token_hash == token_hash, UserSession.is_active == True).first()

def invalidate_session(db: Session, token: str):
    token_hash = hash_token(token)
    session = db.query(UserSession).filter(UserSession.session_token_hash == token_hash, UserSession.is_active == True).first()
    if session:
        session.is_active = False
        db.commit()
    return session

def invalidate_all_sessions(db: Session, user_id: int) -> int:
    sessions = db.query(UserSession).filter(UserSession.user_id == user_id, UserSession.is_active == True).all()
    for s in sessions:
        s.is_active = False
    db.commit()
    return len(sessions)
