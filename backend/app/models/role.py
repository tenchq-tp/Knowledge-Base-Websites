from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)

    user_profile = relationship("UserProfile", back_populates="role", cascade="all, delete")
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete")