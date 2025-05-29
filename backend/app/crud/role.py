from sqlalchemy.orm import Session
from app.models.role import Role
from app.schemas.role import RoleCreate, RoleUpdate

def get_role_by_id(db: Session, role_id: int):
    return db.query(Role).filter(Role.id == role_id).first()

def get_all_roles(db: Session):
    return db.query(Role).all()

def create_role(db: Session, role_data: RoleCreate):
    role = Role(**role_data.dict())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

def update_role(db: Session, role_id: int, role_data: RoleUpdate):
    role = get_role_by_id(db, role_id)
    if not role:
        return None
    for key, value in role_data.dict(exclude_unset=True).items():
        setattr(role, key, value)
    db.commit()
    db.refresh(role)
    return role

def delete_role(db: Session, role_id: int):
    role = get_role_by_id(db, role_id)
    if not role:
        return None
    db.delete(role)
    db.commit()
    return role
