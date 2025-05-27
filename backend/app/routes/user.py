from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user import UserResponse, UserProfileUpdate, UserSafeResponse, UserProfileResponse
from app.models.user import User, UserRole
from app.routes.auth import get_current_user
from app.crud import user as crud_user

router = APIRouter(prefix="/users", tags=["User Management"])

def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user is admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[UserRole] = Query(None),
    is_verified: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """List all users with filtering (admin only)"""
    users = crud_user.get_users_list(
        db=db, 
        skip=skip, 
        limit=limit, 
        role=role.value if role else None,
        is_verified=is_verified
    )
    return users

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get user by ID with full details (admin only)"""
    user = crud_user.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/{user_id}/role")
def update_user_role(
    user_id: int,
    new_role: UserRole,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update user role (admin only)"""
    user = crud_user.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from changing their own role
    if user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    user.role = new_role
    user.modified_by = admin_user.id
    db.commit()
    db.refresh(user)
    
    return {"message": f"User role updated to {new_role.value}", "user": UserSafeResponse.from_orm(user)}

@router.put("/{user_id}/verify")
def verify_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Verify user email (admin only)"""
    if not crud_user.verify_user_email(db, user_id, verified_by=admin_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User verified successfully"}

@router.put("/{user_id}/profile", response_model=UserProfileResponse)
def update_user_profile_admin(
    user_id: int,
    profile_update: UserProfileUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update any user's profile (admin only)"""
    user = crud_user.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    updated_profile = crud_user.update_user_profile(
        db=db,
        user_id=user_id,
        profile_update=profile_update,
        modified_by=admin_user.id
    )
    
    if not updated_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return updated_profile

@router.post("/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    new_password: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Reset user password (admin only)"""
    if not crud_user.update_user_password(db, user_id, new_password, modified_by=admin_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Invalidate all user sessions
    crud_user.invalidate_all_user_sessions(db, user_id)
    
    return {"message": "Password reset successfully. User logged out from all sessions."}

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Soft delete user (admin only)"""
    user = crud_user.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deleting themselves
    if user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Instead of hard delete, mark as unverified and inactive
    user.is_verified = False
    user.modified_by = admin_user.id
    
    # Invalidate all sessions
    crud_user.invalidate_all_user_sessions(db, user_id)
    
    db.commit()
    
    return {"message": "User deactivated successfully"}