from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.database import Base

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    icon = Column(String, nullable=True)
    name = Column(String, unique=True, nullable=False)  # เช่น view_user, edit_user
    description = Column(String, nullable=True)

    roles = relationship("RolePermission", back_populates="permission", cascade="all, delete")
