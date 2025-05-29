from sqlalchemy import Column, BigInteger, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class UserSetting(Base):
    __tablename__ = "user_settings"

    user_id = Column(BigInteger, ForeignKey("users.id"), primary_key=True)
    language = Column(String, default="en")
    theme = Column(String, default="white")

    user = relationship("User", back_populates="setting")
