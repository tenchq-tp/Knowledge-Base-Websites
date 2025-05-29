from pydantic import BaseModel

class CategoryBase(BaseModel):
    icon: str | None = None
    name: str
    description: str | None = None
    
class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    pass 

class CategoryResponse(CategoryBase):
    id: int

    class Config:
        orm_mode = True