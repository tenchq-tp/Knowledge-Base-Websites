from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Body, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Union
import json
from app.db.session import get_db
from app.schemas.article import ArticleCreate, ArticleOut, ArticleUpdate, ArticleMediaIn, ArticleOutSeparateMedia
from app.crud.article import create_article_with_categories, list_articles, create_media, update_article_with_categories, delete_article, parse_positions_field
from app.services.minio_service import MinIOArticleService, get_minio_article_service
from app.models.article import Article, ArticleMedia, ArticleViewLog, MediaTypeEnum
from datetime import datetime, timedelta
from app.routes.auth import get_current_user
from app.models.user import User

async def get_current_user_optional(current_user: Optional[User] = Depends(get_current_user)) -> Optional[User]:
    try:
        return current_user
    except HTTPException:
        return None

router = APIRouter(prefix="/v1/api/articles", tags=["Articles"], dependencies=[Depends(get_current_user)])

@router.post("/", response_model=ArticleOut)
def create_article_with_media(
    title: str = Form(...),
    slug: str = Form(...),
    embedded_files: List[UploadFile] = File(None),
    attached_files: List[UploadFile] = File(None),
    content: Optional[str] = Form(None),
    category_ids: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    embedded_files_list = embedded_files if embedded_files else []
    attached_files_list = attached_files if attached_files else []

    article_data = ArticleCreate(title=title, slug=slug, content=content)

    # แปลง category_ids จาก string เป็น list[int]
    category_ids_list = []
    if category_ids:
        try:
            category_ids_list = [int(x.strip()) for x in category_ids.split(',') if x.strip()]
        except ValueError:
            raise HTTPException(status_code=422, detail="category_ids must be comma-separated integers")

    # สร้าง article และเชื่อม category
    article = create_article_with_categories(db, article_data, category_ids_list)

    minio_service = get_minio_article_service()

    media_refs = []  # เก็บ (filename, url) เพื่อแทนใน content

    # อัพโหลดไฟล์ embedded
    for file in embedded_files_list:
        url = minio_service.upload_embedded_file(article.id, file)
        media = ArticleMedia(
            article_id=article.id,
            filename=file.filename,
            file_type=file.content_type,
            url=url,
            media_type=MediaTypeEnum.embedded,
            uploaded_at=datetime.utcnow()
        )
        db.add(media)
        media_refs.append((file.filename, url))

    # อัพโหลดไฟล์ attached
    for file in attached_files_list:
        url = minio_service.upload_attached_file(article.id, file)
        media = ArticleMedia(
            article_id=article.id,
            filename=file.filename,
            file_type=file.content_type,
            url=url,
            media_type=MediaTypeEnum.attached,
            uploaded_at=datetime.utcnow()
        )
        db.add(media)
        media_refs.append((file.filename, url))

    # แทนที่ตัวแปรใน content ด้วย URL จริง
    if content:
        for filename, url in media_refs:
            key = f"{{{filename.rsplit('.', 1)[0]}}}"
            content = content.replace(key, url)
        article.content = content

    db.commit()
    db.refresh(article)

    return article

@router.get("/{slug}", response_model=ArticleOut)
def get_article_separate(slug: str, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.slug == slug).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.get("/", response_model=List[ArticleOut])
def list_all(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return list_articles(db)

@router.put("/{slug}", response_model=ArticleOut)
def update_article_route(
    slug: str,
    title: str = Form(...),
    new_slug: str = Form(...),
    content: Optional[str] = Form(None),
    media_links: Optional[List[ArticleMediaIn]] = Body(None),
    category_ids: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # แปลง category_ids เช่นเดียวกับ create
    if category_ids:
        try:
            category_ids_list = [int(x.strip()) for x in category_ids.split(',') if x.strip()]
        except ValueError:
            raise HTTPException(status_code=422, detail="category_ids must be comma-separated integers")
    else:
        category_ids_list = []

    data = ArticleUpdate(title=title, slug=new_slug, content=content, media_links=media_links, category_ids=category_ids_list)
    article = update_article_with_categories(db, slug, data)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.delete("/{slug}")
def delete_article_route(slug: str, db: Session = Depends(get_db)):
    success = delete_article(db, slug)
    if not success:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"detail": "Article deleted"}
