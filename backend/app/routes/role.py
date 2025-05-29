from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
import app.crud.role as crud
import app.schemas.role as schemas
from app.routes.auth import get_current_user  # Adjust the import path as needed
from app.models.user import User


router = APIRouter(prefix="/roles", tags=["Role"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=list[schemas.RoleResponse])
def get_all_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
    ):
    return crud.get_all_roles(db)

@router.get("/{role_id}", response_model=schemas.RoleResponse)
def get_role(
    role_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role = crud.get_role_by_id(db, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@router.post("/", response_model=schemas.RoleResponse)
def create_role(
    role: schemas.RoleCreate, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
    ):
    return crud.create_role(db, role)

@router.put("/{role_id}", response_model=schemas.RoleResponse)
def update_role(
    role_id: int, role: schemas.RoleUpdate, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated = crud.update_role(db, role_id, role)
    if not updated:
        raise HTTPException(status_code=404, detail="Role not found")
    return updated

@router.delete("/{role_id}", response_model=schemas.RoleResponse)
def delete_role(
    role_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deleted = crud.delete_role(db, role_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Role not found")
    return deleted
