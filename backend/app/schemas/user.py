from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, date
from app.models.user import GenderType

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
   
class UserLogin(BaseModel):
    username: str
    password: str

class UserProfileBase(BaseModel):
    title: Optional[str] = Field(None, max_length=50)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    gender: Optional[GenderType] = None
    country: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[int] = None
    is_verified: Optional[bool] = None

    class Config:
        from_attributes = True

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    # id: int
    # user_id: int
    full_name: str
    display_name: str
    created_at: datetime
    modified_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    role_id: Optional[int] = None
    is_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    modified_at: Optional[datetime] = None
    profile: Optional[UserProfileResponse] = None

    class Config:
        from_attributes = True

class UserSafeResponse(BaseModel):
    """Safe user response without sensitive data"""
    id: int
    username: str
    role_id: Optional[int] = None
    is_verified: bool
    session_id: Optional[str] = None
    
    class Config:
        from_attributes = True

class SessionResponse(BaseModel):
    """Session response without sensitive token data"""
    id: str
    device_info: Optional[str] = None
    ip_address: Optional[str] = None
    expires_at: datetime
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserSafeResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str
    
class LogoutRequest(BaseModel):
    username: str

class ChangePasswordRequest(BaseModel):
    username: str = Field(...,min_length=3, max_length=50)
    old_password: str = Field(...,min_length=8)
    new_password: str = Field(...,min_length=8)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    role_id: Optional[int] = None
    is_verified: Optional[bool] = False
    profile: Optional[UserProfileBase] = None
 