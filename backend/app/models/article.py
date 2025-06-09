from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, BigInteger, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, INET
from datetime import datetime
from app.db.database import Base

class Article(Base):
    __tablename__ = "article"
    id = Column(Integer, primary_key=True)
    title = Column(Text, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    content = Column(Text)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    media_links = relationship("ArticleMedia", back_populates="article")
    view_logs = relationship("ArticleViewLog", back_populates="article", cascade="all, delete-orphan")
    categories = relationship("Category", secondary="article_category", back_populates="articles")

    @property
    def category_names(self):
        return [c.name for c in self.categories] if self.categories else []

class MediaFile(Base):
    __tablename__ = "media_file"
    id = Column(Integer, primary_key=True)
    filename = Column(Text, nullable=False)
    file_type = Column(String, nullable=False)
    url = Column(Text, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    article_links = relationship("ArticleMedia", back_populates="media")


class ArticleMedia(Base):
    __tablename__ = "article_media"
    id = Column(Integer, primary_key=True)
    article_id = Column(Integer, ForeignKey("article.id", ondelete="CASCADE"))
    media_id = Column(Integer, ForeignKey("media_file.id", ondelete="CASCADE"))
    position = Column(Integer, default=0)

    article = relationship("Article", back_populates="media_links")
    media = relationship("MediaFile", back_populates="article_links")

class ArticleViewLog(Base):
    __tablename__ = "article_view_log"

    id = Column(Integer, primary_key=True)
    article_id = Column(Integer, ForeignKey("article.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ip_address = Column(INET, nullable=False, index=True)
    viewed_at = Column(DateTime, default=datetime.utcnow, index=True)

    article = relationship("Article", back_populates="view_logs")
    
class ArticleCategory(Base):
    __tablename__ = "article_category"
    id = Column(Integer, primary_key=True)
    article_id = Column(Integer, ForeignKey("article.id", ondelete="CASCADE"))
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"))
    
    __table_args__ = (UniqueConstraint("article_id", "category_id", name="_article_category_uc"),)