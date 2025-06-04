from sqlalchemy.orm import Session, joinedload
from typing import Optional, List, Union
from app.models import role_permission as role_permission_models
from app.schemas import role_permission as role_permission_schemas

def get_role_permission_by_id(db: Session, rp_id: int) -> Optional[role_permission_models.RolePermission]:
    return db.query(role_permission_models.RolePermission).filter(role_permission_models.RolePermission.id == rp_id).first()

def get_all_role_permissions(db: Session, skip: int = 0, limit: int = 100) -> List[role_permission_models.RolePermission]:
    return db.query(role_permission_models.RolePermission).offset(skip).limit(limit).all()

def get_role_permissions_by_role_id(db: Session, role_id: int) -> list[role_permission_models.RolePermission]:
    return db.query(role_permission_models.RolePermission).filter(role_permission_models.RolePermission.role_id == role_id).all()

def create_role_permission(db: Session, rp: role_permission_schemas.RolePermissionCreate):
    if isinstance(rp.permission_id, int):
        existing = db.query(role_permission_models.RolePermission).filter_by(
            role_id=rp.role_id,
            permission_id=rp.permission_id
        ).first()
        if existing:
            return existing

        db_rp = role_permission_models.RolePermission(
            role_id=rp.role_id,
            permission_id=rp.permission_id
        )
        db.add(db_rp)
        db.commit()
        db.refresh(db_rp)
        return db_rp

    elif isinstance(rp.permission_id, list):
        created = []
        for perm_id in rp.permission_id:
            exists = db.query(role_permission_models.RolePermission).filter_by(
                role_id=rp.role_id,
                permission_id=perm_id
            ).first()

            if not exists:
                db_rp = role_permission_models.RolePermission(
                    role_id=rp.role_id,
                    permission_id=perm_id
                )
                db.add(db_rp)
                created.append(db_rp)

        db.commit()
        for rp_item in created:
            db.refresh(rp_item)
        return created

    # fallback ถ้า type ไม่ถูกต้อง
    raise ValueError("Invalid type for permission_id")

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

def update_role_permission(
    db: Session,
    role_id: int,
    permission_ids: Union[int, List[int]]
) -> List[role_permission_models.RolePermission]:
    permission_ids = [permission_ids] if isinstance(permission_ids, int) else permission_ids

    db.query(role_permission_models.RolePermission).filter(
        role_permission_models.RolePermission.role_id == role_id
    ).delete(synchronize_session=False)

    db.commit()

    new_rps = []
    for pid in permission_ids:
        db_rp = role_permission_models.RolePermission(
            role_id=role_id,
            permission_id=pid
        )
        db.add(db_rp)
        new_rps.append(db_rp)

    db.commit()
    for rp in new_rps:
        db.refresh(rp)

    return new_rps

