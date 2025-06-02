from sqlalchemy.orm import Session
from typing import Optional, List
from app.models import role as role_models
from app.schemas import role as role_schemas

def get_role_by_id(db: Session, role_id: int) -> Optional[role_models.Role]:
    return db.query(role_models.Role).filter(role_models.Role.id == role_id).first()

def get_all_roles(db: Session, skip: int = 0, limit: int = 100) -> List[role_models.Role]:
    return db.query(role_models.Role).offset(skip).limit(limit).all()

def create_role(db: Session, role: role_schemas.RoleCreate) -> role_models.Role:
    db_role = role_models.Role(**role.dict())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

def delete_role(db: Session, role_id: int) -> bool:
    db_role = db.query(role_models.Role).filter(role_models.Role.id == role_id).first()
    if not db_role:
        return False
    db.delete(db_role)
    db.commit()
    return True


def update_role(db: Session, role_id: int, role_update: role_schemas.RoleCreate) -> Optional[role_models.Role]:
    db_role = get_role_by_id(db, role_id)
    if db_role:
        for key, value in role_update.dict(exclude_unset=True).items():
            setattr(db_role, key, value)
        db.commit()
        db.refresh(db_role)
    return db_role