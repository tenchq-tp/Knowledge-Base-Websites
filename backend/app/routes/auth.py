from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user import (
    UserCreate, UserLogin, Token, UserResponse, UserSafeResponse, 
    RefreshTokenRequest, SessionResponse
)
from app.crud import user as crud_user
from app.core.security import create_access_token, verify_token, validate_password_strength
from app.core.config import settings
from app.models.user import User
import ipaddress

router = APIRouter(prefix="/auth", tags=["Authentication"])
# เปลี่ยนจาก HTTPBearer เป็น HTTPBasic สำหรับ username/password
security = HTTPBasic()

def get_client_ip(request: Request) -> str:
    """Get client IP address"""
    # Check for forwarded IP first (when behind proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    # Check for real IP
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to remote address
    return request.client.host

def get_device_info(request: Request) -> dict:
    """Extract device information from request"""
    user_agent = request.headers.get("User-Agent", "Unknown")
    ip_address = get_client_ip(request)
    
    return {
        "ip_address": ip_address,
        "user_agent": user_agent,
        "device_info": f"IP: {ip_address}"
    }

@router.post("/register", response_model=UserSafeResponse)
def register_user(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    """Register a new user with password validation"""
    
    # Validate password strength
    if not validate_password_strength(user.password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long and contain at least 3 of: uppercase, lowercase, digits, special characters"
        )
    
    # Check if user already exists
    if crud_user.get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if crud_user.get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user (profile will be auto-created by trigger)
    new_user = crud_user.create_user(db=db, user=user)
    
    return UserSafeResponse(
        id=new_user.id,
        username=new_user.username,
        role=new_user.role,
        is_verified=new_user.is_verified,
        profile=new_user.profile
    )

@router.post("/login", response_model=Token)
def login_user(user_credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Login user and return JWT token with session management"""
    
    user = crud_user.authenticate_user(db, user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Allow login without email verification - user can verify later
    
    # Get device info
    device_info = get_device_info(request)
    
    # Create session with secure tokens
    session, session_token, refresh_token = crud_user.create_user_session(
        db=db,
        user_id=user.id,
        device_info=device_info["device_info"],
        ip_address=device_info["ip_address"],
        user_agent=device_info["user_agent"]
    )
    
    # Create JWT access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "session_id": str(session.id)}, 
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserSafeResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            is_verified=user.is_verified,
            profile=user.profile
        )
    )
    
@router.post("/refresh", response_model=Token)
def refresh_token(refresh_request: RefreshTokenRequest, request: Request, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    
    result = crud_user.refresh_user_session(db, refresh_request.refresh_token)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    new_session_token, new_refresh_token = result
    
    # Get session to find user
    session = crud_user.validate_session_token(db, new_session_token)
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session not found")
    
    user = crud_user.get_user_by_id(db, session.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Create new JWT access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "session_id": str(session.id)}, 
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserSafeResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            is_verified=user.is_verified,
            profile=user.profile
        )
    )

def get_current_user(credentials: HTTPBasicCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    """Get current authenticated user using Basic Auth (username/password)"""
    
    # Authenticate user with username and password
    user = crud_user.authenticate_user(db, credentials.username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    return user

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user info including profile"""
    return current_user

@router.post("/logout")
def logout_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout user and invalidate session"""
    
    # This would require extracting session info from JWT
    # For now, just return success
    return {"message": "Logged out successfully"}

@router.post("/logout-all")
def logout_all_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout user from all sessions"""
    
    count = crud_user.invalidate_all_user_sessions(db, current_user.id)
    return {"message": f"Logged out from {count} sessions"}

@router.get("/sessions", response_model=list[SessionResponse])
def get_my_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all active sessions for current user"""
    
    sessions = crud_user.get_user_active_sessions(db, current_user.id)
    return [
        SessionResponse(
            id=str(session.id),
            device_info=session.device_info,
            ip_address=str(session.ip_address) if session.ip_address else None,
            expires_at=session.expires_at,
            is_active=session.is_active,
            created_at=session.created_at
        )
        for session in sessions
    ]

@router.post("/verify-email/{user_id}")
def verify_email(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Verify user email (in production, this would be token-based)"""
    
    if not crud_user.verify_user_email(db, user_id):
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Email verified successfully"}

# Background task to clean expired sessions
@router.post("/admin/clean-sessions")
def clean_expired_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Clean expired sessions (admin only)"""
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    count = crud_user.clean_expired_sessions(db)
    return {"message": f"Cleaned {count} expired sessions"}