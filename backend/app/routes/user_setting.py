from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
import app.crud.user_setting as crud
import app.schemas.user_setting as schemas
from app.routes.auth import get_current_user  # Adjust the import path as needed
from app.models.user import User  # Adjust the import path as needed

router = APIRouter(prefix="/v1/api/user-settings", tags=["User Settings"])

@router.get("/", response_model=schemas.UserSettingResponse)
def get_current_user_setting(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    setting = crud.get_setting_by_username(db, current_user.username)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting


@router.post("/", response_model=schemas.UserSettingResponse)
def upsert_current_user_setting(
    setting: schemas.UserSettingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = crud.upsert_user_setting(db, current_user.username, setting)
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return result

@router.delete("/")
def delete_current_user_setting(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = crud.delete_user_setting(db, current_user.username)
    if not result:
        raise HTTPException(status_code=404, detail="Setting not found")
    return {"message": "User setting deleted successfully"}