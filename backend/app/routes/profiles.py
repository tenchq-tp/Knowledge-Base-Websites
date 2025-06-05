from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user import UserProfileResponse, UserProfileUpdate, UserSafeResponse
from app.crud import user as crud_user
from app.models.user import User
from app.routes.auth import get_current_user

router = APIRouter(prefix="/profiles", tags=["User Profiles"])

@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile"""
    if not current_user.profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return current_user.profile

@router.put("/me", response_model=UserProfileResponse)
def update_my_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    updated_profile = crud_user.update_user_profile(
        db=db, 
        user_id=current_user.id, 
        profile_update=profile_update,
        modified_by=current_user.id
    )
    
    if not updated_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return updated_profile

@router.get("/{user_id}", response_model=UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """Get public profile of any verified user"""
    user = crud_user.get_user_by_id(db, user_id=user_id)
    if not user or not user.profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user.profile

@router.get("/", response_model=List[UserSafeResponse])
def search_users(
    q: str = None,
    country: str = None,
    city: str = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    users = crud_user.get_users_list(db, skip=skip, limit=limit, is_verified=True)
    return [
        UserSafeResponse(
            id=user.id,
            username=user.username,
            role_id=user.role_id,
            is_verified=user.is_verified,
            profile=user.profile
        )
        for user in users
    ]