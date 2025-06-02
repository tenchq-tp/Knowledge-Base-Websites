from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
import app.crud.permission as crud
import app.schemas.permission as schemas
from app.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/permissions", tags=["Permission"])

@router.get("/", response_model=list[schemas.PermissionResponse])
def get_all_permissions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return crud.get_all_permissions(db)

@router.post("/", response_model=schemas.PermissionResponse)
def create_permission(permission: schemas.PermissionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return crud.create_permission(db, permission)

@router.get("/{permission_id}", response_model=schemas.PermissionResponse)
def get_permission(permission_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    permission = crud.get_permission_by_id(db, permission_id)
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    return permission

@router.put("/{permission_id}", response_model=schemas.PermissionResponse)
def update_permission(permission_id: int, permission: schemas.PermissionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    updated = crud.update_permission(db, permission_id, permission)
    if not updated:
        raise HTTPException(status_code=404, detail="Permission not found")
    return updated

@router.delete("/{permission_id}")
def delete_permission(permission_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    permission = crud.get_permission_by_id(db, permission_id)
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    crud.delete_permission(db, permission_id)
    return {"detail": "Permission deleted successfully"}