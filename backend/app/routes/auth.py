from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user import (
    UserCreate, Token, UserSafeResponse, 
    RefreshTokenRequest, SessionResponse, 
)
from app.crud import user as crud_user
from app.core.security import create_access_token, validate_password_strength
from app.core.config import settings
from app.models.user import User, UserSession
from jose import jwt, JWTError
from uuid import UUID
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI()
router = APIRouter(prefix="/v1/api/auth", tags=["Authentication"])

#dependency class ใน FastAPI ที่ใช้สำหรับการดึง token (โดยเฉพาะ JWT token) จาก header ของ HTTP request เพื่อใช้ในการตรวจสอบสิทธิ์ (authentication)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/api/auth/login") 

#ปรับ OpenAPI schema เพื่อให้ Swagger UI รองรับ OAuth2
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="My API",
        version="1.0.0",
        description="API with JWT + username/password (OAuth2PasswordBearer)",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "OAuth2Password": {
            "type": "oauth2",
            "flows": {
                "password": {
                    "tokenUrl": "/auth/login",  
                    "scopes": {}
                }
            }
        }
    }
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method["security"] = [{"OAuth2Password": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return request.client.host

def get_device_info(request: Request) -> dict:
    user_agent = request.headers.get("User-Agent", "Unknown")
    ip_address = get_client_ip(request)
    
    return {
        "ip_address": ip_address,
        "user_agent": user_agent,
        "device_info": f"IP: {ip_address}"
    }

@router.post("/register", response_model=UserSafeResponse)
def register_user(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    
    if not validate_password_strength(user.password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long and contain at least 3 of: uppercase, lowercase, digits, special characters"
        )
    
    if crud_user.get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if crud_user.get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    new_user = crud_user.create_user(db=db, user=user)
    
    return UserSafeResponse(
        id=new_user.id,
        username=new_user.username,
        is_verified=new_user.is_verified,
        profile=new_user.profile
    )

@router.post("/login", response_model=Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), request: Request = ..., db: Session = Depends(get_db)):
    user = crud_user.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    device_info = get_device_info(request)
    
    session, access_token, refresh_token = crud_user.create_user_session(
        db=db,
        user_id=user.id,
        device_info=device_info["device_info"],
        ip_address=device_info["ip_address"],
        user_agent=device_info["user_agent"]
    )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    access_token = create_access_token(
        data={"sub": user.username, "session_id": str(session.id)},
        expires_delta=access_token_expires
    )

    user_safe = UserSafeResponse(
        id=user.id,
        username=user.username,
        role_id=user.profile.role_id if user.profile else None,
        role_name=user.profile.role_name if user.profile else None,
        is_verified=user.is_verified,
        session_id=str(session.id),
    )

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, #แแปลงจากนาที → วินาที เพื่อให้ expires_in ใน token response เป็นจำนวน วินาที ตามมาตรฐานที่ client คาดหวัง
        user=user_safe
    )

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_request: RefreshTokenRequest, request: Request, db: Session = Depends(get_db)):
    result = crud_user.refresh_user_session(db, refresh_request.refresh_token)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    new_session_token, new_refresh_token = result
    
    session = crud_user.validate_session_token(db, new_session_token)
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session not found")
    
    user = crud_user.get_user_by_id(db, session.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "session_id": str(session.id)},  # ใช้ username เป็น sub
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
            role_id=user.profile.role_id if user.profile else None,
            is_verified=user.is_verified,
            profile=user.profile
        )
    )

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception

        session_id = UUID(payload.get("session_id"))
        session = db.query(UserSession).filter_by(id=session_id, is_active=True).first()
        if not session:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/logout")
def logout_user(
    current_user: User = Depends(get_current_user),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    session_id = UUID(jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])["session_id"])
    session = db.query(UserSession).filter_by(id=session_id).first()

    if session:
        session.session_token_hash = None 
        session.refresh_token_hash = None
        session.is_active = False
        session.modified_at = datetime.utcnow()
        db.commit()

    return {"message": f"User '{current_user.username}' logged out successfully"}


@router.post("/logout-all")
def logout_all_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    
    count = crud_user.invalidate_all_user_sessions(db, current_user.id)
    return {"message": f"Logged out from {count} sessions"}

@router.get("/sessions", response_model=list[SessionResponse])
def get_my_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    
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
    if not crud_user.verify_user_email(db, user_id):
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Email verified successfully"}
