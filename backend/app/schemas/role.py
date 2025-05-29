from pydantic import BaseModel
from typing import Optional

class RoleBase(BaseModel):
    icon: Optional[str] = None
    name: str
    permission: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleUpdate(RoleBase):
    pass

class RoleResponse(RoleBase):
    id: int

    class Config:
        orm_mode = True
