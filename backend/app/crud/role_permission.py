from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from app.models import role_permission as role_permission_models
from app.schemas import role_permission as role_permission_schemas

def get_role_permission_by_id(db: Session, rp_id: int) -> Optional[role_permission_models.RolePermission]:
    return db.query(role_permission_models.RolePermission).filter(role_permission_models.RolePermission.id == rp_id).first()

def get_all_role_permissions(db: Session, skip: int = 0, limit: int = 100) -> List[role_permission_models.RolePermission]:
    return db.query(role_permission_models.RolePermission).offset(skip).limit(limit).all()

def get_role_permissions_by_role_id(db: Session, role_id: int) -> list[role_permission_models.RolePermission]:
    return db.query(role_permission_models.RolePermission).filter(role_permission_models.RolePermission.role_id == role_id).all()

def create_role_permission(db: Session, rp: role_permission_schemas.RolePermissionCreate):
    existing = db.query(role_permission_models.RolePermission).filter(
        role_permission_models.RolePermission.role_id == rp.role_id,
        role_permission_models.RolePermission.permission_id == rp.permission_id
    ).first()

    if existing:
        return existing

    db_rp = role_permission_models.RolePermission(role_id=rp.role_id, permission_id=rp.permission_id)
    db.add(db_rp)
    db.commit()
    db.refresh(db_rp)
    return db_rp


def delete_role_permission(db: Session, rp_id: int) -> Optional[role_permission_schemas.RolePermissionResponse]:
    rp = db.query(role_permission_models.RolePermission)\
        .options(joinedload(role_permission_models.RolePermission.permission))\
        .filter(role_permission_models.RolePermission.id == rp_id)\
        .first()
    if not rp:
        return None

    # clone ก่อนลบ
    rp_data = role_permission_schemas.RolePermissionResponse.from_orm(rp)

    db.delete(rp)
    db.commit()

    return rp_data

def update_role_permission(db: Session, rp_id: int, rp_update: role_permission_schemas.RolePermissionCreate) -> Optional[role_permission_models.RolePermission]:
    db_rp = get_role_permission_by_id(db, rp_id)
    if db_rp:
        for key, value in rp_update.dict(exclude_unset=True).items():
            setattr(db_rp, key, value)
        db.commit()
        db.refresh(db_rp)
    return db_rp
