from pydantic import BaseModel
from typing import Optional, List

class SubCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "public"

class SubCategoryCreate(SubCategoryBase):
    category_id: int

class SubCategoryUpdate(SubCategoryBase):
    pass

class SubCategoryResponse(SubCategoryBase):
    id: int

    class Config:
        orm_mode = True

class CategoryBase(BaseModel):
    id: int
    icon: Optional[str] = None
    name: str
    description: Optional[str] = None
    status: Optional[str] = "public"

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    subcategories: List[SubCategoryResponse] = []

    class Config:
        orm_mode = True