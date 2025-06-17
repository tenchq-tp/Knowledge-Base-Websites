from sqlalchemy.orm import Session
from typing import Optional, List
from fastapi import HTTPException, UploadFile
from app.models.article import Article, ArticleMedia, ArticleViewLog
from app.models.category import Category
from app.models.user import User, UserSession
from app.schemas.article import ArticleCreate, ArticleUpdate
from app.services.minio_service import MinIOArticleService
from datetime import datetime, timedelta
from sqlalchemy import text

def str_to_list(s: Optional[str]) -> List[str]:
    if not s:
        return []
    return [item.strip() for item in s.replace(',', ' ').split() if item.strip()]

def create_article_with_categories(db: Session, article_data: ArticleCreate, category_ids: Optional[List[int]] = None):
    category_ids = category_ids or []

    if category_ids:
        existing_categories = db.query(Category.id).filter(Category.id.in_(category_ids)).all()
        existing_ids = {cat.id for cat in existing_categories}
        missing_ids = set(category_ids) - existing_ids
        if missing_ids:
            raise HTTPException(status_code=422, detail=f"Category IDs not found: {sorted(missing_ids)}")

    article = Article(
        title=article_data.title,
        slug=article_data.slug,
        content=article_data.content,
        status=article_data.status or "private",
        start_date=datetime.fromisoformat(article_data.start_date) if article_data.start_date else None,
        end_date=datetime.fromisoformat(article_data.end_date) if article_data.end_date else None,
        tags=article_data.tags or [],
        hashtag=article_data.hashtag or [],
        view_count=0
    )

    if category_ids:
        article.categories = db.query(Category).filter(Category.id.in_(category_ids)).all()

    db.add(article)
    db.commit()
    db.refresh(article)
    return article

def upload_and_attach_media(db: Session, article: Article, embedded_files: List[UploadFile], attached_files: List[UploadFile], minio_service: MinIOArticleService):
    media_refs = []
    for file in embedded_files:
        url = minio_service.upload_embedded_file(article.id, file)
        media = ArticleMedia(
            article_id=article.id,
            filename=file.filename,
            file_type=file.content_type,
            url=url,
            media_type="embedded",
            uploaded_at=datetime.utcnow()
        )
        db.add(media)
        media_refs.append((file.filename, url))

    for file in attached_files:
        url = minio_service.upload_attached_file(article.id, file)
        media = ArticleMedia(
            article_id=article.id,
            filename=file.filename,
            file_type=file.content_type,
            url=url,
            media_type="attached",
            uploaded_at=datetime.utcnow()
        )
        db.add(media)
        media_refs.append((file.filename, url))

    db.commit()
    return media_refs

def replace_media_placeholders(content: str, media_refs: List[tuple]) -> str:
    for filename, url in media_refs:
        key = f"{{{filename.rsplit('.', 1)[0]}}}"
        content = content.replace(key, url)
    return content

def get_article_by_slug(db: Session, slug: str):
    return db.query(Article).filter(Article.slug == slug).first()

def list_articles(db: Session):
    return db.query(Article).order_by(Article.view_count.desc()).all()

def update_article_with_categories(db: Session, slug: str, data: ArticleUpdate, category_ids: List[int] = []):
    article = db.query(Article).filter(Article.slug == slug).first()
    if not article:
        return None

    for field in ["title", "slug", "content", "status", "tags", "hashtag"]:
        value = getattr(data, field)
        if value is not None:
            setattr(article, field, value)

    if data.start_date:
        article.start_date = datetime.fromisoformat(data.start_date)
    if data.end_date:
        article.end_date = datetime.fromisoformat(data.end_date)

    db.execute("DELETE FROM article_category WHERE article_id = :aid", {"aid": article.id})
    for cat_id in category_ids:
        db.execute(
            text("INSERT INTO article_category (article_id, category_id) VALUES (:a, :c) ON CONFLICT DO NOTHING"),
            {"a": article.id, "c": cat_id}
        )

    db.commit()
    db.refresh(article)
    return article

def delete_article(db: Session, slug: str):
    article = db.query(Article).filter(Article.slug == slug).first()
    if not article:
        return None
    db.query(ArticleMedia).filter(ArticleMedia.article_id == article.id).delete()
    db.delete(article)
    db.commit()
    return True

def record_article_view(db: Session, article: Article, user: User, session: UserSession):
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    recent_view = db.query(ArticleViewLog).filter(
        ArticleViewLog.article_id == article.id,
        ArticleViewLog.user_id == user.id,
        ArticleViewLog.ip_address == session.ip_address,
        ArticleViewLog.viewed_at >= one_hour_ago,
    ).first()
    if not recent_view:
        view_log = ArticleViewLog(
            article_id=article.id,
            user_id=user.id,
            user_session_id=session.id,
            ip_address=session.ip_address,
            viewed_at=now
        )
        db.add(view_log)
        article.view_count = (article.view_count or 0) + 1
        db.commit()
    return article
