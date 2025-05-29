from sqlalchemy import Column, Integer, String
from app.db.database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    icon = Column(String, nullable=True)
    name = Column(String, nullable=False)
    permission = Column(String, nullable=True) 
