from sqlalchemy.orm import Session
from typing import Optional, List
from app.models import permission as permission_models
from app.schemas import permission as permission_schemas

def get_permission_by_id(db: Session, permission_id: int) -> Optional[permission_models.Permission]:
    return db.query(permission_models.Permission).filter(permission_models.Permission.id == permission_id).first()

def get_all_permissions(db: Session, skip: int = 0, limit: int = 100) -> List[permission_models.Permission]:
    return db.query(permission_models.Permission).offset(skip).limit(limit).all()

def create_permission(db: Session, permission: permission_schemas.PermissionCreate) -> permission_models.Permission:
    db_permission = permission_models.Permission(**permission.dict())
    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)
    return db_permission

def delete_permission(db: Session, permission_id: int) -> bool:
    db_permission = db.query(permission_models.Permission).filter(permission_models.Permission.id == permission_id).first()
    if not db_permission:
        return False
    db.delete(db_permission)
    db.commit()
    return True

def update_permission(db: Session, permission_id: int, permission_update: permission_schemas.PermissionCreate) -> Optional[permission_models.Permission]:
    db_permission = get_permission_by_id(db, permission_id)
    if db_permission:
        for key, value in permission_update.dict(exclude_unset=True).items():
            setattr(db_permission, key, value)
        db.commit()
        db.refresh(db_permission)
    return db_permission