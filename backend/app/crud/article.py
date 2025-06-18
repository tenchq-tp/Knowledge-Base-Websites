from sqlalchemy.orm import Session
from typing import Optional, List
from fastapi import HTTPException, UploadFile
from app.models.article import Article, ArticleMedia, ArticleViewLog, Tag, Hashtag, ArticleComment
from app.models.category import Category, SubCategory
from app.models.user import User, UserSession
from app.schemas.article import ArticleCreate, ArticleUpdate
from app.services.minio_service import MinIOArticleService
from datetime import datetime, timedelta
from sqlalchemy import text
from slugify import slugify

def str_to_list(s: Optional[str]) -> List[str]:
    if not s:
        return []
    return [item.strip() for item in s.replace(',', ' ').split() if item.strip()]

def get_or_create_tags(db: Session, tag_names: List[str]):
    tags = []
    for name in tag_names:
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            db.flush()  # เพื่อให้มี ID ทันที
        tags.append(tag)
    return tags

def get_or_create_hashtags(db: Session, hashtag_names: List[str]):
    hashtags = []
    for name in hashtag_names:
        h = db.query(Hashtag).filter(Hashtag.name == name).first()
        if not h:
            h = Hashtag(name=name)
            db.add(h)
            db.flush()
        hashtags.append(h)
    return hashtags

def create_article_with_categories(
    db: Session,
    article_data: ArticleCreate,
    category_ids: Optional[List[int]] = None,
    subcategory_ids: Optional[List[int]] = None
):
    category_ids = category_ids or []
    subcategory_ids = subcategory_ids or []

    # ✅ ตรวจสอบ categories
    existing_categories = db.query(Category.id).filter(Category.id.in_(category_ids)).all()
    existing_cat_ids = {cat.id for cat in existing_categories}
    missing_cat_ids = set(category_ids) - existing_cat_ids
    if missing_cat_ids:
        raise HTTPException(status_code=422, detail=f"Category IDs not found: {sorted(missing_cat_ids)}")

    # ✅ ตรวจสอบ subcategories
    existing_subcategories = []
    if subcategory_ids:
        existing_subcategories = db.query(SubCategory).filter(SubCategory.id.in_(subcategory_ids)).all()
        existing_sub_ids = {sub.id for sub in existing_subcategories}
        missing_sub_ids = set(subcategory_ids) - existing_sub_ids
        if missing_sub_ids:
            raise HTTPException(status_code=422, detail=f"SubCategory IDs not found: {sorted(missing_sub_ids)}")

        for sub in existing_subcategories:
            if sub.category_id not in existing_cat_ids:
                raise HTTPException(
                    status_code=422,
                    detail=f"SubCategory '{sub.name}' does not belong to selected categories"
                )

    # ✅ สร้าง Article พร้อม slug ชั่วคราว
    article = Article(
        title=article_data.title,
        content=article_data.content,
        status=article_data.status or "private",
        start_date=datetime.fromisoformat(article_data.start_date) if article_data.start_date else None,
        end_date=datetime.fromisoformat(article_data.end_date) if article_data.end_date else None,
        view_count=0,
        slug="temp"  # slug ต้องไม่เป็น None เพื่อผ่าน constraint
    )

    # ✅ ผูกความสัมพันธ์
    article.categories = db.query(Category).filter(Category.id.in_(category_ids)).all()
    article.subcategories = existing_subcategories
    article.tags = get_or_create_tags(db, article_data.tags or [])
    article.hashtags = get_or_create_hashtags(db, article_data.hashtags or [])

    db.add(article)
    db.flush()  # ✅ ได้ article.id แล้ว แต่ยังไม่ commit

    print(f"Title: {article_data.title} -> Slug: {slugify(article_data.title, allow_unicode=True)}")
    # ✅ อัปเดต slug ด้วย id ที่ได้
    article.slug = f"{article.id}/{slugify(article.title, allow_unicode=True)}"
    
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
    try:
        article = db.query(Article).filter(Article.slug == slug).first()
        if not article:
            print(f"Article with slug '{slug}' not found in DB")
        return article
    except Exception as e:
        print(f"Error querying article by slug '{slug}': {e}")
        raise

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
    if data.tags is not None:
        article.tags = get_or_create_tags(db, data.tags)
    if data.hashtag is not None:
        article.hashtags = get_or_create_hashtags(db, data.hashtags)
        
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

def record_article_view(db: Session, article_id: int, user_id: int, ip_address: str):
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)

    recent_view = db.query(ArticleViewLog).filter(
        ArticleViewLog.article_id == article_id,
        ArticleViewLog.ip_address == ip_address,
        ArticleViewLog.viewed_at >= one_hour_ago
    ).first()

    if recent_view:
        return False  # ไม่เพิ่ม view

    # เพิ่ม log
    new_log = ArticleViewLog(
        article_id=article_id,
        user_id=user_id,
        ip_address=ip_address
    )
    db.add(new_log)

    # เพิ่ม view_count
    article = db.query(Article).filter(Article.id == article_id).first()
    if article:
        article.view_count += 1

    db.commit()
    return True

def create_or_update_comment(db: Session, article_id: int, user_id: int, comment_text: str, score: float):
    existing = db.query(ArticleComment).filter_by(article_id=article_id, user_id=user_id).first()
    if existing:
        existing.comment = comment_text
        existing.score = score
    else:
        new_comment = ArticleComment(
            article_id=article_id,
            user_id=user_id,
            comment=comment_text,
            score=score
        )
        db.add(new_comment)
    db.commit()

def get_comments_by_article(db: Session, article_id: int):
    return db.query(ArticleComment).filter_by(article_id=article_id).order_by(ArticleComment.created_at.asc()).all()