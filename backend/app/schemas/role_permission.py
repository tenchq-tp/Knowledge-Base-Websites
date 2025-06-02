from pydantic import BaseModel
from typing import Optional, List, TYPE_CHECKING
from app.schemas.permission import PermissionResponse
from app.schemas.feature import FeatureResponse

class RolePermissionBase(BaseModel):
    role_id: int
    permission_id: int
    feature_id: int

class RolePermissionCreate(RolePermissionBase):
    pass

class RolePermissionUpdate(RolePermissionBase):
    role_id: Optional[int] = None
    permission_id: Optional[int] = None
    feature_id: Optional[int] = None

class RolePermissionResponse(RolePermissionBase):
    id: int
    permission: Optional[PermissionResponse] = None
    feature: Optional[FeatureResponse] = None

    class Config:
        from_attributes = True