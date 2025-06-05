from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Union
import json
from app.db.session import get_db
from app.schemas.article import ArticleCreate, ArticleOut, ArticleUpdate, ArticleMediaIn
from app.crud.article import create_article, get_article_by_slug, list_articles, create_media, update_article, delete_article
from app.services.minio_client import upload_file
from app.models.article import ArticleMedia
from app.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/articles", tags=["Articles"], dependencies=[Depends(get_current_user)])

@router.post("/", response_model=ArticleOut)
def create_article_with_media(
    title: str = Form(...),
    slug: str = Form(...),
    content: Optional[str] = Form(None),
    media_files: List[UploadFile] = File(default=[]), 
    positions: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    print("Before processing, type of media_files:", type(media_files))
    print(f"Number of media_files: {len(media_files)}")

    if not positions:
        positions_list = []
    else:
        try:
            positions_list = json.loads(positions)
            if not isinstance(positions_list, list) or not all(isinstance(i, int) for i in positions_list):
                raise ValueError()
        except Exception:
            raise HTTPException(status_code=400, detail="positions must be a JSON list of integers")

    print(f"Positions list: {positions_list}")

    if len(media_files) != len(positions_list):
        raise HTTPException(status_code=400, detail="Number of media_files and positions must be equal")

    article_data = ArticleCreate(title=title, slug=slug, content=content)
    article = create_article(db, article_data)

    for file, pos in zip(media_files, positions_list):
        url = upload_file(file)
        media = create_media(db, file.filename, file.content_type, url)
        link = ArticleMedia(article_id=article.id, media_id=media.id, position=pos)
        db.add(link)

    db.commit()
    db.refresh(article)
    return article

@router.get("/{slug}", response_model=ArticleOut)
def get(slug: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    article = get_article_by_slug(db, slug)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    content = article.content or ""
    media_links_sorted = sorted(article.media_links, key=lambda x: x.position)
    
    for idx, link in enumerate(media_links_sorted):
        placeholder = f"{{{{media_{idx}}}}}"  # ตัวอย่าง: {{media_0}}
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
