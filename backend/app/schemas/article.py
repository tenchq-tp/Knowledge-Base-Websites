from pydantic import BaseModel, validator
from typing import Optional, List, Union
from datetime import datetime
from fastapi import Form, File, UploadFile
import json
from app.schemas.category import CategoryResponse

class MediaFileOut(BaseModel):
    id: int
    filename: str
    file_type: str
    url: str
    uploaded_at: datetime
    class Config:
        orm_mode = True

class ArticleMediaOut(BaseModel):
    id: int
    media: MediaFileOut
    position: int
    class Config:
        orm_mode = True

class ArticleCreate(BaseModel):
    title: str
    slug: str
    content: Optional[str] = None
    
class ArticleMediaIn(BaseModel):
    media_id: int
    position: int

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    media_links: Optional[List[ArticleMediaIn]] = []

class ArticleOut(ArticleCreate):
    categories: List[CategoryResponse] = []
    id: int
    created_at: datetime
    updated_at: datetime
    view_count: int
    media_links: List[ArticleMediaOut] = []
    class Config:
        orm_mode = True

class ArticleFormIn(BaseModel):
    title: str = Form(...)
    slug: str = Form(...)
    content: Optional[str] = Form(None)
    media_files: List[str] = Form(...)
    positions: Union[str, List[int]] = Form(...)

    @validator("positions", pre=True)
    def parse_positions(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                raise ValueError("positions must be a valid JSON array")
        return v

    @validator("positions")
    def check_length(cls, v, values):
        media_files = values.get("media_files")
        if media_files and len(media_files) != len(v):
            raise ValueError("Number of media_files and positions must be equal")
        return v

class ArticleCategoryIn(BaseModel):
    category_ids: Optional[List[int]] = None

    @validator('category_ids', pre=True)
    def parse_category_ids(cls, v):
        if isinstance(v, str):
            # แปลง "1,2" เป็น [1, 2]
            return [int(x.strip()) for x in v.split(',') if x.strip()]
        return v

class ArticleOutWithCategory(ArticleOut):
    categories: List[CategoryResponse] = []

    class Config:
        orm_mode = True