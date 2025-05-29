from sqlalchemy import Column, Integer, String
from app.db.database import Base

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    icon = Column(String, nullable=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    