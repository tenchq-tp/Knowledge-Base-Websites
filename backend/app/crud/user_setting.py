from sqlalchemy.orm import Session
from app.models.user_setting import UserSetting
from app.models.user import User
from app.schemas.user_setting import UserSettingCreate, UserSettingUpdate

def get_all_settings(db: Session):
    return db.query(UserSetting).all()

def get_setting_by_username(db: Session, username: str):
    return db.query(UserSetting).join(User).filter(User.username == username).first()

def upsert_user_setting(db: Session, username: str, setting_data: UserSettingCreate):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None

    setting = db.query(UserSetting).filter(UserSetting.user_id == user.id).first()

    if setting:
        # UPDATE
        setting.language = setting_data.language
        setting.theme = setting_data.theme
    else:
        # INSERT
        setting = UserSetting(user_id=user.id, **setting_data.model_dump())
        db.add(setting)

    db.commit()
    db.refresh(setting)
    return setting

def delete_user_setting(db: Session, username: str):
    db_setting = get_setting_by_username(db, username)
    if not db_setting:
        return None
    db.delete(db_setting)
    db.commit()
    return db_setting
