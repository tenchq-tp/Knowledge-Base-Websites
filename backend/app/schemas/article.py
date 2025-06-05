from pydantic import BaseModel, validator
from typing import Optional, List, Union
from datetime import datetime
from fastapi import Form, File, UploadFile
import json

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
    id: int
    created_at: datetime
    updated_at: datetime
    media_links: List[ArticleMediaOut] = []
    class Config:
        orm_mode = True

class ArticleFormIn(BaseModel):
    title: str = Form(...)
    slug: str = Form(...)
    content: Optional[str] = Form(None)
    media_files: List[str]
    positions: Union[str, List[int]]

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