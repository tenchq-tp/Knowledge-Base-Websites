from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Body, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Union
import json
from app.db.session import get_db
from app.schemas.article import ArticleCreate, ArticleOut, ArticleUpdate, ArticleMediaIn
from app.crud.article import create_article_with_categories, list_articles, create_media, update_article_with_categories, delete_article, parse_positions_field
from app.services.minio_service import MinIOArticleService, get_minio_article_service
from app.models.article import Article, ArticleMedia, ArticleViewLog
from datetime import datetime, timedelta
from app.routes.auth import get_current_user
from app.models.user import User

async def get_current_user_optional(current_user: Optional[User] = Depends(get_current_user)) -> Optional[User]:
    try:
        return current_user
    except HTTPException:
        return None

router = APIRouter(prefix="/vi/api/articles", tags=["Articles"], dependencies=[Depends(get_current_user)])

@router.post("/", response_model=ArticleOut)
def create_article_with_media(
    title: str = Form(...),
    slug: str = Form(...),
    media_files: List[UploadFile] = File(None),
    content: Optional[str] = Form(None),
    positions: Optional[str] = Form(None),
    category_ids: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if media_files is None:
        media_files_list = []
    elif isinstance(media_files, list):
        media_files_list = media_files
    else:
        media_files_list = [media_files]

    positions_list = parse_positions_field(positions, media_files_list)

    article_data = ArticleCreate(title=title, slug=slug, content=content)
    if category_ids:
        try:
            category_ids_list = [int(x.strip()) for x in category_ids.split(',') if x.strip()]
        except ValueError:
            raise HTTPException(status_code=422, detail="category_ids must be comma-separated integers")
    else:
        category_ids_list = []

    article = create_article_with_categories(db, article_data, category_ids_list)
    minio_service = get_minio_article_service()

    media_refs = []  # 👉 เก็บ (filename, url)

    for file, pos in zip(media_files_list, positions_list):
        url = minio_service.upload_article_file(file)
        media = create_media(db, file.filename, file.content_type, url)
        link = ArticleMedia(article_id=article.id, media_id=media.id, position=pos)
        db.add(link)
        media_refs.append((file.filename, url))

    # ✅ แทนใน content ด้วย url ก่อนบันทึก
    if content:
        for filename, url in media_refs:
            key = f"{{{filename.rsplit('.', 1)[0]}}}"  # เอาเฉพาะชื่อโดยไม่เอา .png/.jpg
            content = content.replace(key, url)
        article.content = content  # บันทึก content ใหม่ลง model

    db.commit()
    db.refresh(article)
    return article

@router.get("/{slug}", response_model=ArticleOut)
def get_article_with_view_tracking(
    slug: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.slug == slug).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    ip = request.client.host or "0.0.0.0"
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)

    recent_log = db.query(ArticleViewLog).filter(
        ArticleViewLog.article_id == article.id,
        ArticleViewLog.user_id == current_user.id,
        ArticleViewLog.ip_address == ip,
        ArticleViewLog.viewed_at >= one_hour_ago,
    ).first()

    if not recent_log:
        log = ArticleViewLog(
            article_id=article.id,
            user_id=current_user.id,
            ip_address=ip,
            viewed_at=datetime.utcnow(),
        )
        db.add(log)
        article.view_count += 1
        db.commit()
        db.refresh(article)

    content = article.content or ""
    media_links_sorted = sorted(article.media_links, key=lambda x: x.position)
    for idx, link in enumerate(media_links_sorted):
        placeholder = f"{{{{media_{idx}}}}}"
        media_url = link.media.url
        content = content.replace(placeholder, media_url)

    response = article.__dict__.copy()
    response['content'] = content
    return response

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
