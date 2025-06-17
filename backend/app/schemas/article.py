from pydantic import BaseModel, validator
from typing import Optional, List, Union
from datetime import datetime
from fastapi import Form, File, UploadFile
import json
from enum import Enum
from app.schemas.category import CategoryResponse

class MediaType(str, Enum):
    embedded = "embedded"
    attached = "attached"
    
class TagOut(BaseModel):
    name: str
    class Config:
        orm_mode = True
        
class HashtagOut(BaseModel):
    name: str
    class Config:
        orm_mode = True
        
class StatusOut(BaseModel):
    name: str

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
    media_type: str
    class Config:
        orm_mode = True

class ArticleCreate(BaseModel):
    title: str
    slug: str
    tags: Optional[List[str]] = []
    hashtags: Optional[List[str]] = []
    content: Optional[str] = None
    status: Optional[str] = "private"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    
class ArticleMediaIn(BaseModel):
    media_id: int
    media_type: MediaType

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None  
    tags: Optional[List[str]] = None
    hashtags: Optional[List[str]] = None
    
class ArticleOut(ArticleCreate):
    id: int
    tags: List[TagOut]
    hashtags: List[HashtagOut]
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    view_count: int
    categories: List[CategoryResponse] = []
    media_links: List[ArticleMediaOut] = []
    class Config:
        orm_mode = True

class ArticleFormIn(BaseModel):
    title: str = Form(...)
    slug: str = Form(...)
    content: Optional[str] = Form(None)
    media_files: List[str] = Form(None)
    media_types: Union[str, List[str]] = Form(None)

    @validator("media_types", pre=True)
    def parse_types(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                raise ValueError("media_types must be a valid JSON array")
        return v
    
    @validator("media_types")
    def check_types_length(cls, v, values):
        media_files = values.get("media_files")
        if media_files and len(media_files) != len(v):
            raise ValueError("Number of media_files and media_types must be equal")
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

class ArticleOutSeparateMedia(ArticleCreate):
    id: int
    created_at: datetime
    updated_at: datetime
    view_count: int
    categories: List[CategoryResponse] = []
    embedded_files: List[ArticleMediaOut] = []
    attached_files: List[ArticleMediaOut] = []

    class Config:
        orm_mode = True
