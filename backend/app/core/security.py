import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from .config import settings

pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"], #กำหนดว่าใช้วิธีการเข้ารหัสแบบ "argon2", "bcrypt"
    deprecated="auto", #ถ้ามีหลายอัลกอริทึม จะเลือกอันที่ไม่ถูก mark ว่าเก่า
    argon2__rounds=3, #จำนวนรอบในการประมวลผล(ยิ่งมากยิ่งปลอดภัยแต่ก็ใช้เวลานานขึ้น)ค่าdefaultทั่วไป: 2 – 4
    argon2__memory_cost=65536, #หน่วยความจำที่ใช้ในการ hash = 64 MB ค่า default ที่แนะนำ: 64MB – 256MB ยิ่งสูง = ปลอดภัยขึ้นแต่กิน RAM มากขึ้น
    argon2__parallelism=1, #จำนวน thread/CPU core ที่ใช้ประมวลผลพร้อมกัน
    bcrypt__rounds=12 #จำนวนรอบของ bcrypt (รอบมากขึ้น → ปลอดภัยขึ้นแต่ช้าขึ้น)
)

#ตรวจสอบว่า plaintext password ตรงกับ hashed password หรือไม่
def verify_password(plain_password: str, hashed_password: str) -> bool: 
    return pwd_context.verify(plain_password, hashed_password)

#แปลงรหัสผ่านธรรมดาเป็นแบบเข้ารหัส (hash) เพื่อเก็บในฐานข้อมูล
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

#สร้าง token ใช้เป็น refresh token, session token
def generate_secure_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)

#ใช้ แฮช token ก่อนเก็บลงฐานข้อมูล เพื่อความปลอดภัย
def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

#สร้าง JWT Access Token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None, session_id: Optional[UUID] = None):
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({
        "exp": expire,
        "type": "access",
    })

    if session_id:
        to_encode["session_id"] = str(session_id)

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

#สร้าง refresh token 32 bytes ไม่ใช่ JWT แต่เป็นแบบ random string
def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    return generate_secure_token(32)

#ตรวจสอบว่า JWT token ถูกต้องหรือไม่
def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if username is None or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        return username
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

#ตรวจสอบว่ารหัสผ่านแข็งแรงพอหรือไม่
def validate_password_strength(password: str) -> bool:
    if len(password) < 8:
        return False
    if len(password) > 128:
        return False
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
    
    return sum([has_upper, has_lower, has_digit, has_special]) >= 3