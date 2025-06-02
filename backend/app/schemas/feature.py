from pydantic import BaseModel, Field
from typing import Optional, List

class FeatureBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=255)

class FeatureCreate(FeatureBase):
    pass

class FeatureUpdate(FeatureBase):
    pass

class FeatureResponse(FeatureBase):
    id: int

    class Config:
        from_attributes = True