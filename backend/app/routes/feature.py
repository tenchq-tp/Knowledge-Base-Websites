from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
import app.crud.feature as crud
import app.schemas.feature as schemas
from app.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/features", tags=["Feature"])

@router.get("/", response_model=list[schemas.FeatureResponse])
def get_all_features(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return crud.get_all_features(db)

@router.post("/", response_model=schemas.FeatureResponse)
def create_feature(feature: schemas.FeatureCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return crud.create_feature(db, feature)

@router.get("/{feature_id}", response_model=schemas.FeatureResponse)
def get_feature(feature_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    feature = crud.get_feature_by_id(db, feature_id)
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    return feature

@router.put("/{feature_id}", response_model=schemas.FeatureResponse)
def update_feature(feature_id: int, feature: schemas.FeatureUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    updated = crud.update_feature(db, feature_id, feature)
    if not updated:
        raise HTTPException(status_code=404, detail="Feature not found")
    return updated

@router.delete("/{feature_id}")
def delete_feature(feature_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    feature = crud.get_feature_by_id(db, feature_id)
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")

    crud.delete_feature(db, feature_id)
    return {"detail": "Feature deleted successfully"}
