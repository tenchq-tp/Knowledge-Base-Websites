from sqlalchemy.orm import Session
from typing import Optional, List
from fastapi import Form, File, UploadFile, HTTPException
from app.models.article import Article, MediaFile, ArticleMedia, ArticleViewLog
from app.models.user import User, UserSession
from app.schemas.article import ArticleCreate, ArticleUpdate
from datetime import datetime, timedelta
import json
from sqlalchemy import text

def create_article_with_categories(db: Session, article_data, category_ids: Optional[List[int]] = None):
    if category_ids is None:
        category_ids = []  
    article = Article(**article_data.dict())
    db.add(article)
    db.commit()
    db.refresh(article)

    for cat_id in category_ids:
        db.execute(
            text("INSERT INTO article_category (article_id, category_id) VALUES (:a, :c) ON CONFLICT DO NOTHING"),
            {"a": article.id, "c": cat_id}
        )
    db.commit()
    return article

def create_media(db: Session, filename: str, file_type: str, url: str):
    media = MediaFile(filename=filename, file_type=file_type, url=url)
    db.add(media)
    db.commit()
    db.refresh(media)
    return media

def parse_positions_field(positions: Optional[str] = Form(None), media_files: List[UploadFile] = File(default=[])):
    if not positions or str(positions).strip() == '':
        positions_list = [0] * len(media_files)
    else:
        try:
            positions_list = json.loads(positions)
            if not isinstance(positions_list, list) or not all(isinstance(i, int) for i in positions_list):
                raise ValueError()
        except Exception:
            raise HTTPException(status_code=400, detail="positions must be a JSON list of integers")
    if len(positions_list) != len(media_files):
        raise HTTPException(status_code=400, detail="Number of media_files and positions must be equal")
    return positions_list

def get_article_by_slug(db: Session, slug: str):
    return db.query(Article).filter(Article.slug == slug).first()

def list_articles(db: Session):
    return db.query(Article).all()

def update_article_with_categories(db: Session, slug: str, data: ArticleUpdate, category_ids: List[int]):
    article = db.query(Article).filter(Article.slug == slug).first()
    if not article:
        return None

    if data.title is not None:
        article.title = data.title
    if data.slug is not None:
        article.slug = data.slug
    if data.content is not None:
        article.content = data.content

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

    used_media_ids = db.query(ArticleMedia.media_id).distinct().all()
    used_media_ids = [m[0] for m in used_media_ids]
    unused_media = db.query(MediaFile).filter(MediaFile.id.notin_(used_media_ids)).all()
    for m in unused_media:
        db.delete(m)

    db.commit()
    return True

def record_article_view(db: Session, article: Article, user: User, session: UserSession):
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)

    recent_view = (
        db.query(ArticleViewLog)
        .filter(
            ArticleViewLog.article_id == article.id,
            ArticleViewLog.user_id == user.id,
            ArticleViewLog.ip_address == session.ip_address,
            ArticleViewLog.viewed_at >= one_hour_ago,
        )
        .first()
    )

    if not recent_view:
        view_log = ArticleViewLog(
            article_id=article.id,
            user_id=user.id,
            user_session_id=session.id,
            ip_address=session.ip_address,
            viewed_at=now,
        )
        db.add(view_log)

        article.view_count = (article.view_count or 0) + 1
        db.commit()