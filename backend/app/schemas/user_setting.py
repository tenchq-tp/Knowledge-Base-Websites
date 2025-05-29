from pydantic import BaseModel
from typing import Literal

class UserSettingBase(BaseModel):
    language: str
    theme: Literal["black", "white"]

class UserSettingCreate(UserSettingBase):
    pass

class UserSettingUpdate(UserSettingBase):
    pass

class UserSettingResponse(UserSettingBase):
    user_id: int

    class Config:
        from_attributes = True
