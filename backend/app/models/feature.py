from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.database import Base

class Feature(Base):
    __tablename__ = "features"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)         # ชื่อฟีเจอร์ เช่น dashboard, users_page
    description = Column(String, nullable=True)

    permissions = relationship("RolePermission", back_populates="feature", cascade="all, delete")
