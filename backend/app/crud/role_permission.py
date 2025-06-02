from sqlalchemy.orm import Session
from typing import Optional, List
from app.models import role_permission as role_permission_models
from app.schemas import role_permission as role_permission_schemas

def get_role_permission_by_id(db: Session, rp_id: int) -> Optional[role_permission_models.RolePermission]:
    return db.query(role_permission_models.RolePermission).filter(role_permission_models.RolePermission.id == rp_id).first()

def get_all_role_permissions(db: Session, skip: int = 0, limit: int = 100) -> List[role_permission_models.RolePermission]:
    return db.query(role_permission_models.RolePermission).offset(skip).limit(limit).all()

def create_role_permission(db: Session, rp: role_permission_schemas.RolePermissionCreate) -> role_permission_models.RolePermission:
    db_rp = role_permission_models.RolePermission(**rp.dict())
    db.add(db_rp)
    db.commit()
    db.refresh(db_rp)
    return db_rp

def delete_role_permission(db: Session, rp_id: int) -> bool:
    db_rp = get_role_permission_by_id(db, rp_id)
    if not db_rp:
        return False
    db.delete(db_rp)
    db.commit()
    return True

def update_role_permission(db: Session, rp_id: int, rp_update: role_permission_schemas.RolePermissionCreate) -> Optional[role_permission_models.RolePermission]:
    db_rp = get_role_permission_by_id(db, rp_id)
    if db_rp:
        for key, value in rp_update.dict(exclude_unset=True).items():
            setattr(db_rp, key, value)
        db.commit()
        db.refresh(db_rp)
    return db_rp