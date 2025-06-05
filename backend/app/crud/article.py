from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.article import Article, MediaFile, ArticleMedia
from app.schemas.article import ArticleCreate, ArticleUpdate

def create_article(db: Session, data: ArticleCreate):
    article = Article(**data.dict()) 
    db.add(article)
    db.commit()
    db.refresh(article)
    return article

def get_article_by_slug(db: Session, slug: str):
    return db.query(Article).filter(Article.slug == slug).first()

def list_articles(db: Session):
    return db.query(Article).all()

def create_media(db: Session, filename: str, file_type: str, url: str):
    media = MediaFile(filename=filename, file_type=file_type, url=url)
    db.add(media)
    db.commit()
    db.refresh(media)
    return media

def update_article(db: Session, slug: str, data: ArticleUpdate):
    article = db.query(Article).filter(Article.slug == slug).first()
    if not article:
        return None

    if data.title is not None:
        article.title = data.title
    if data.slug is not None:
        article.slug = data.slug
    if data.content is not None:
        article.content = data.content

    if data.media_links is not None:
        existing_links = db.query(ArticleMedia).filter(ArticleMedia.article_id == article.id).all()
        existing_media_ids = {link.media_id for link in existing_links}
        new_media_ids = {m.media_id for m in data.media_links}

        to_remove_ids = existing_media_ids - new_media_ids
        if to_remove_ids:
            db.query(ArticleMedia).filter(
                ArticleMedia.article_id == article.id,
                ArticleMedia.media_id.in_(to_remove_ids)
            ).delete(synchronize_session=False)

        to_add_ids = new_media_ids - existing_media_ids
        for m in data.media_links:
            if m.media_id in to_add_ids:
                db.add(ArticleMedia(
                    article_id=article.id,
                    media_id=m.media_id,
                    position=m.position
                ))

        for m in data.media_links:
            if m.media_id in existing_media_ids:
                db.query(ArticleMedia).filter_by(
                    article_id=article.id,
                    media_id=m.media_id
                ).update({"position": m.position})

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
