from pydantic import BaseModel, Field
from typing import Optional, List

class PermissionBase(BaseModel):
    name: str = Field(..., max_length=50)
    description: Optional[str] = Field(None, max_length=255)

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(PermissionBase):
    pass

class PermissionResponse(PermissionBase):
    id: int

    class Config:
        from_attributes = True