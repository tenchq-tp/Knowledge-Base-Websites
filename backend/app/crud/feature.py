from sqlalchemy.orm import Session
from typing import Optional, List
from app.models import feature as feature_models
from app.schemas import feature as feature_schemas

def get_feature_by_id(db: Session, feature_id: int) -> Optional[feature_models.Feature]:
    return db.query(feature_models.Feature).filter(feature_models.Feature.id == feature_id).first()

def get_all_features(db: Session, skip: int = 0, limit: int = 100) -> List[feature_models.Feature]:
    return db.query(feature_models.Feature).offset(skip).limit(limit).all()

def create_feature(db: Session, feature: feature_schemas.FeatureCreate) -> feature_models.Feature:
    db_feature = feature_models.Feature(**feature.dict())
    db.add(db_feature)
    db.commit()
    db.refresh(db_feature)
    return db_feature

def delete_feature(db: Session, feature_id: int) -> bool:
    db_feature = db.query(feature_models.Feature).filter(feature_models.Feature.id == feature_id).first()
    if not db_feature:
        return False
    db.delete(db_feature)
    db.commit()
    return True

def update_feature(db: Session, feature_id: int, feature_update: feature_schemas.FeatureCreate) -> Optional[feature_models.Feature]:
    db_feature = get_feature_by_id(db, feature_id)
    if db_feature:
        for key, value in feature_update.dict(exclude_unset=True).items():
            setattr(db_feature, key, value)
        db.commit()
        db.refresh(db_feature)
    return db_feature