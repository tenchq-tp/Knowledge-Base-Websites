from pydantic import BaseModel
from typing import Optional, List, Union, TYPE_CHECKING
from app.schemas.permission import PermissionResponse

class RolePermissionBase(BaseModel):
    role_id: int
    permission_id: Union[int, List[int]]
    
class RolePermissionMEBase(BaseModel):
    permission_id: Union[int, List[int]]

class RolePermissionCreate(RolePermissionBase):
    pass

class RolePermissionUpdate(RolePermissionBase):
    permission_id: Optional[Union[int, List[int]]]

class RolePermissionResponse(RolePermissionBase):
    id: int
    permission: Optional[PermissionResponse] = None

    class Config:
        from_attributes = True

class RolePermissionBodyResponse(RolePermissionMEBase):
    id: int
    permission: Optional[PermissionResponse] = None

    class Config:
        from_attributes = True

class RolePermissionsMEResponse(BaseModel):
    role_id: int
    role_name: str
    permissions: List[RolePermissionBodyResponse]

    class Config:
        from_attributes = True