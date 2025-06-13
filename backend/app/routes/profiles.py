from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Optional
from app.db.database import get_db
from app.schemas.user import UserProfileResponse, UserProfileUpdate
from app.crud import user as crud_user
from app.models.user import User
from app.routes.auth import get_current_user
from app.services.minio_service import MinIOAvatarService, get_minio_avatar_service, validate_avatar_image, resize_avatar
from app.crud.user import remove_user_avatar, update_user_avatar
import urllib.parse
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/v1/api/profiles", tags=["User Profiles"])

@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    if not current_user.profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return current_user.profile

@router.put("/me", response_model=UserProfileResponse)
def update_my_profile(
    title: Optional[str] = Form(None),
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    date_of_birth: Optional[date] = Form(None),
    gender: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    file: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    minio_service: MinIOAvatarService = Depends(get_minio_avatar_service)
):
    # โหลดโปรไฟล์ปัจจุบัน
    profile = crud_user.get_user_by_id(db, current_user.id).profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # อัปเดตเฉพาะฟิลด์ที่ส่งมา
    updated_fields = {}
    for field_name, value in {
        "title": title,
        "first_name": first_name,
        "last_name": last_name,
        "phone": phone,
        "date_of_birth": date_of_birth,
        "gender": gender,
        "country": country,
        "city": city,
        "address": address
    }.items():
        if value is not None:
            setattr(profile, field_name, value)
            updated_fields[field_name] = value

    if updated_fields:
        profile.modified_by = current_user.id
        profile.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(profile)

    # ถ้ามีไฟล์รูป
    if file:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are allowed for avatar")

        file.file.seek(0)
        file_content = file.file.read()
        is_valid, error_msg, dimensions = validate_avatar_image(file_content, max_size_mb=5)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)

        if dimensions and (dimensions[0] > 400 or dimensions[1] > 400):
            file_content = resize_avatar(file_content, max_width=400, max_height=400)

        try:
            old_file_key = remove_user_avatar(db, current_user.id, modified_by=current_user.id)
            if old_file_key:
                minio_service.delete_avatar(old_file_key)

            file_key, file_url = minio_service.upload_avatar_from_bytes(
                user_id=current_user.id,
                file_content=file_content,
                filename=file.filename,
                content_type=file.content_type
            )

            update_user_avatar(db, current_user.id, file_url, file.filename, modified_by=current_user.id)
            db.commit()
            profile = crud_user.get_user_by_id(db, current_user.id).profile

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload avatar: {str(e)}")

    return UserProfileResponse.from_orm(profile)

@router.get("/{user_id}", response_model=UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = crud_user.get_user_by_id(db, user_id=user_id)
    if not user or not user.profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    # if not user.is_verified:
    #     raise HTTPException(
    #         status_code=status.HTTP_404_NOT_FOUND,
    #         detail="User not found"
    #     )
    
    return user.profile

@router.put("/{user_id}", response_model=UserProfileResponse)
def update_user_profile_by_id(
    user_id: int,
    title: Optional[str] = Form(None),
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    date_of_birth: Optional[date] = Form(None),
    gender: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    file: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    minio_service: MinIOAvatarService = Depends(get_minio_avatar_service)
):
    # ❗ ตัวอย่างการตรวจสอบสิทธิ์ (เปิดใช้ถ้าต้องการจำกัดเฉพาะ admin)
    # if current_user.role != "admin":
    #     raise HTTPException(status_code=403, detail="Not authorized")

    profile = crud_user.get_user_by_id(db, user_id).profile
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    updated_fields = {}
    for field_name, value in {
        "title": title,
        "first_name": first_name,
        "last_name": last_name,
        "phone": phone,
        "date_of_birth": date_of_birth,
        "gender": gender,
        "country": country,
        "city": city,
        "address": address
    }.items():
        if value is not None:
            setattr(profile, field_name, value)
            updated_fields[field_name] = value

    if updated_fields:
        profile.modified_by = current_user.id
        profile.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(profile)

    # ✅ อัปโหลด avatar ถ้ามี
    if file:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are allowed for avatar")

        file.file.seek(0)
        file_content = file.file.read()
        is_valid, error_msg, dimensions = validate_avatar_image(file_content, max_size_mb=5)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)

        if dimensions and (dimensions[0] > 400 or dimensions[1] > 400):
            file_content = resize_avatar(file_content, max_width=400, max_height=400)

        try:
            old_file_key = remove_user_avatar(db, user_id=user_id, modified_by=current_user.id)
            if old_file_key:
                minio_service.delete_avatar(old_file_key)

            file_key, file_url = minio_service.upload_avatar_from_bytes(
                user_id=user_id,
                file_content=file_content,
                filename=file.filename,
                content_type=file.content_type
            )

            update_user_avatar(db, user_id, file_url, file.filename, modified_by=current_user.id)
            db.commit()
            profile = crud_user.get_user_by_id(db, user_id).profile

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload avatar: {str(e)}")

    return UserProfileResponse.from_orm(profile)


@router.post("/avatar/{user_id}", response_model=UserProfileResponse)
def upload_user_avatar(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    minio_service: MinIOAvatarService = Depends(get_minio_avatar_service)
):
    # ตรวจสอบสิทธิ์ (admin หรือเจ้าของ)
    if current_user.id != user_id and current_user.profile.role_name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to upload avatar for this user")
    
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image files are allowed for avatar")
    
    file.file.seek(0)
    file_content = file.file.read()
    
    is_valid, error_msg, dimensions = validate_avatar_image(file_content, max_size_mb=5)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
    
    if dimensions and (dimensions[0] > 400 or dimensions[1] > 400):
        file_content = resize_avatar(file_content, max_width=400, max_height=400)
    
    try:
        old_file_key = remove_user_avatar(db, user_id, modified_by=current_user.id)
        if old_file_key:
            minio_service.delete_avatar(old_file_key)
        
        file_key, file_url = minio_service.upload_avatar_from_bytes(
            user_id=user_id,
            file_content=file_content,
            filename=file.filename,
            content_type=file.content_type
        )
        
        update_user_avatar(db, user_id, file_url, file.filename, modified_by=current_user.id)
        
        updated_user = crud_user.get_user_by_id(db, user_id)
        return UserProfileResponse.from_orm(updated_user.profile)
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to upload avatar: {str(e)}")
        
@router.get("/avatar/{user_id}")
def get_user_avatar(user_id: int, db: Session = Depends(get_db)):
    user = crud_user.get_user_by_id(db, user_id)
    
    if not user or not user.profile or not user.profile.avatar_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found")

    full_url = user.profile.avatar_url
    return JSONResponse(content={"avatar_url": full_url})
    
@router.delete("/avatar/{user_id}")
def delete_user_avatar(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    minio_service: MinIOAvatarService = Depends(get_minio_avatar_service)
):
    if current_user.id != user_id and current_user.profile.role_name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete avatar for this user")
    
    old_file_key = remove_user_avatar(db, user_id, modified_by=current_user.id)
    if not old_file_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No avatar found to delete")
    
    minio_service.delete_avatar(old_file_key)
    
    return {"message": "Avatar deleted successfully"}
