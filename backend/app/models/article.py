from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Article(Base):
    __tablename__ = "article"
    id = Column(Integer, primary_key=True)
    title = Column(Text, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    media_links = relationship("ArticleMedia", back_populates="article")


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
