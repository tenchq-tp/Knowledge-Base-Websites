from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user import UserResponse, UserUpdate,UserProfileUpdate, UserSafeResponse, UserProfileResponse, UserCreate, ChangePasswordRequest
from app.models.user import User, UserSession
from app.routes.auth import get_current_user
from app.crud import user as crud_user
from app.core.security import verify_password, get_password_hash, validate_password_strength
from app.services.minio_service import MinIOAvatarService, get_minio_avatar_service, validate_avatar_image, resize_avatar
from app.crud.user import remove_user_avatar, update_user_avatar
import urllib.parse
from fastapi.responses import JSONResponse
router = APIRouter(prefix="/v1/api/users", tags=["User Management"])

@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_verified: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = crud_user.get_users_list(
        db=db, 
        skip=skip, 
        limit=limit, 
        is_verified=is_verified
    )
    return users

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = crud_user.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = crud_user.update_user(db, user_id=user_id, user_update=user_update, modified_by=current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/verify/{user_id}")
def verify_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not crud_user.verify_user_email(db, user_id, verified_by=current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User verified successfully"}

@router.post("/change-password", summary="Change password without login")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db)
):
    user = crud_user.get_user_by_username(db, username=payload.username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(payload.old_password, user.password):
        raise HTTPException(status_code=401, detail="Old password is incorrect")

    if not validate_password_strength(payload.new_password):
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 8 characters and include 3 of: uppercase, lowercase, digits, special characters"
        )

    user.password = get_password_hash(payload.new_password)
    user.modified_by = user.id
    db.commit()

    crud_user.invalidate_all_user_sessions(db, user.id)

    return {"message": "Password changed successfully. All sessions invalidated."}

@router.post("/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    new_password: str,
    db: Session = Depends(get_db),
    curr_user: User = Depends(get_current_user)
):
    if not crud_user.update_user_password(db, user_id, new_password, modified_by=curr_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    crud_user.invalidate_all_user_sessions(db, user_id)
    
    return {"message": "Password reset successfully. User logged out from all sessions."}

@router.delete("/{username}", response_model=UserSafeResponse)
def delete_user_by_username(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Optional: Restrict role (e.g., only admin can delete)
    # if current_user.role != "admin":
    #     raise HTTPException(status_code=403, detail="Not authorized to delete user")

    user = crud_user.get_user_by_username(db, username=username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    active_session = (
        db.query(UserSession)
        .filter(UserSession.user_id == user.id, UserSession.is_active == True)
        .first()
    )
    if active_session:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete user with an active session."
        )

    user_data = UserSafeResponse(
        id=user.id,
        username=user.username,
        role_id=user.role_id,
        role_name=user.role.name if user.role else None,
        is_verified=user.is_verified,
        profile=user.profile,
        session_id=None
    )

    crud_user.delete_user(db, user)
    return user_data

@router.post("/create", response_model=UserSafeResponse, summary="Create new user")
def create_user_by_authenticated_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):    
    # Optional: Restrict role (e.g., only admin can create)
    # if current_user.role != "admin":
    #     raise HTTPException(status_code=403, detail="Not authorized to create user")

    # Validation: Check for existing email or username
    if crud_user.get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if crud_user.get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create the user
    new_user = crud_user.create_user(db=db, user=user, created_by=current_user.id)

    return UserSafeResponse(
        id=new_user.id,
        username=new_user.username,
        role_id=new_user.profile.role_id,
        role_name=new_user.profile.role_name,
        is_verified=new_user.is_verified,
        profile=new_user.profile,
        session_id=None
    )

@router.post("/avatar/{user_id}", response_model=UserResponse)
def upload_user_avatar(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    minio_service: MinIOAvatarService = Depends(get_minio_avatar_service)
):
    if current_user.id != user_id and current_user.profile.role_name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to upload avatar for this user")
    
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if not file.content_type or not file.content_type.startswith("image/"):
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
        return updated_user

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to upload avatar: {str(e)}")

@router.get("/avatar/{user_id}")
def get_user_avatar(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = crud_user.get_user_by_id(db, user_id)
    if not user or not user.profile or not user.profile.avatar_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found")
    return {"avatar_url": user.profile.avatar_url}

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
