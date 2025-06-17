from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, BigInteger, UniqueConstraint, Table
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, INET, ARRAY
from datetime import datetime
from app.db.database import Base
from sqlalchemy import Enum
import enum

class MediaTypeEnum(str, enum.Enum):
    embedded = "embedded"
    attached = "attached"

class Article(Base):
    __tablename__ = "article"
    id = Column(Integer, primary_key=True)
    title = Column(Text, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    status = Column(String, nullable=False, default="private")
    content = Column(Text)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    tags = relationship("Tag", secondary="article_tag", back_populates="articles")
    hashtags = relationship("Hashtag", secondary="article_hashtag", back_populates="articles")
    article_media = relationship("ArticleMedia", back_populates="article", cascade="all, delete-orphan")
    view_logs = relationship("ArticleViewLog", back_populates="article", cascade="all, delete-orphan")
    categories = relationship("Category", secondary="article_category", back_populates="articles")
    subcategories = relationship("SubCategory", secondary="article_subcategory", back_populates="articles")

    @property
    def category_names(self):
        return [c.name for c in self.categories] if self.categories else []

    @property
    def subcategory_names(self):
        return [s.name for s in self.subcategories] if self.subcategories else []
    
    @property
    def tag_names(self):
        return [t.name for t in self.tags]

    @property
    def hashtag_names(self):
        return [h.name for h in self.hashtags]

    @property
    def media_links(self):
        return self.article_media or []

    @property
    def embedded_media(self):
        return [m for m in self.media_links if m.media_type == MediaTypeEnum.embedded]

    @property
    def attached_media(self):
        return [m for m in self.media_links if m.media_type == MediaTypeEnum.attached]

class ArticleMedia(Base):
    __tablename__ = "article_media"
    id = Column(Integer, primary_key=True)
    article_id = Column(Integer, ForeignKey("article.id", ondelete="CASCADE"), index=True)
    filename = Column(Text, nullable=False)
    file_type = Column(String, nullable=False)
    url = Column(Text, nullable=False)
    media_type = Column(Enum(MediaTypeEnum, name="media_type_enum"), nullable=False, default="attached", index=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    article = relationship("Article", back_populates="article_media")
    
    @property
    def media(self):
        return self

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

class ArticleSubCategory(Base):
    __tablename__ = "article_subcategory"
    
    id = Column(Integer, primary_key=True)
    article_id = Column(Integer, ForeignKey("article.id", ondelete="CASCADE"))
    subcategory_id = Column(Integer, ForeignKey("subcategories.id", ondelete="CASCADE"))

    __table_args__ = (
        UniqueConstraint("article_id", "subcategory_id", name="_article_subcategory_uc"),
    )

class Tag(Base):
    __tablename__ = "tag"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)

    articles = relationship("Article", secondary="article_tag", back_populates="tags")

class Hashtag(Base):
    __tablename__ = "hashtag"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)

    articles = relationship("Article", secondary="article_hashtag", back_populates="hashtags")

class ArticleTag(Base):
    __tablename__ = "article_tag"
    article_id = Column(Integer, ForeignKey("article.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tag.id", ondelete="CASCADE"), primary_key=True)

class ArticleHashtag(Base):
    __tablename__ = "article_hashtag"
    article_id = Column(Integer, ForeignKey("article.id", ondelete="CASCADE"), primary_key=True)
    hashtag_id = Column(Integer, ForeignKey("hashtag.id", ondelete="CASCADE"), primary_key=True)
