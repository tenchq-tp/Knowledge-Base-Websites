from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Body, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Union
import json
from app.db.session import get_db
from app.schemas.article import ArticleCreate, ArticleOut, ArticleUpdate, ArticleMediaIn
from app.crud.article import create_article, get_article_by_slug, list_articles, create_media, update_article, delete_article, parse_positions_field
from app.services.minio_client import upload_file
from app.models.article import Article, ArticleMedia, ArticleViewLog
from datetime import datetime, timedelta
from app.routes.auth import get_current_user
from app.models.user import User, UserSession
from app.core.security import hash_token
import uuid

async def get_current_user_optional(current_user: Optional[User] = Depends(get_current_user)) -> Optional[User]:
    try:
        return current_user
    except HTTPException:
        return None

router = APIRouter(prefix="/articles", tags=["Articles"], dependencies=[Depends(get_current_user)])

from fastapi import UploadFile, File
from typing import Union, List

@router.post("/", response_model=ArticleOut)
def create_article_with_media(
    title: str = Form(...),
    slug: str = Form(...),
    content: Optional[str] = Form(None),
    media_files: Union[UploadFile, List[UploadFile], None] = File(default=None),
    positions_list: List[int] = Depends(parse_positions_field),
    db: Session = Depends(get_db)
):
    # เตรียม media_files_list ให้เป็น list เสมอ
    if media_files is None:
        media_files_list = []
    elif isinstance(media_files, list):
        media_files_list = media_files
    else:
        media_files_list = [media_files]

    # สร้าง article ใน DB
    article_data = ArticleCreate(title=title, slug=slug, content=content)
    article = create_article(db, article_data)

    # วนลูป media_files กับ positions โดยใช้ zip จะจับคู่จนกว่าตัวใดตัวหนึ่งหมด
    for file, pos in zip(media_files_list, positions_list):
        url = upload_file(file)  # ฟังก์ชัน upload ไฟล์
        media = create_media(db, file.filename, file.content_type, url)  # สร้าง media record
        link = ArticleMedia(article_id=article.id, media_id=media.id, position=pos)  # ลิงก์ media กับ article
        db.add(link)

    db.commit()
    db.refresh(article)
    return article

@router.get("/{slug}", response_model=ArticleOut)
def get_article_with_view_tracking(
    slug: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # assume ต้องล็อกอินก่อนดู
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

    # render media inline
    content = article.content or ""
    media_links_sorted = sorted(article.media_links, key=lambda x: x.position)
    for idx, link in enumerate(media_links_sorted):
        placeholder = f"{{{{media_{idx}}}}}"
        media_url = link.media.url
        img_tag = f"<img src='{media_url}' alt='media_{idx}' />"
        content = content.replace(placeholder, img_tag)

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
    db: Session = Depends(get_db)
):
    data = ArticleUpdate(title=title, slug=new_slug, content=content, media_links=media_links)
    article = update_article(db, slug, data)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.delete("/{slug}")
def delete_article_route(slug: str, db: Session = Depends(get_db)):
    success = delete_article(db, slug)
    if not success:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"detail": "Article deleted"}
