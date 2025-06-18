from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Body, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from slugify import slugify

from app.db.session import get_db
from app.schemas.article import ArticleCreate, ArticleOut, ArticleUpdate, ArticleMediaIn, TagOut, HashtagOut, ArticleCommentCreate, ArticleCommentOut
from app.crud.article import (
    create_article_with_categories,
    upload_and_attach_media,
    replace_media_placeholders,
    str_to_list,
    list_articles,
    update_article_with_categories,
    delete_article,
    get_article_by_slug,
    create_or_update_comment,
    get_comments_by_article
)
from app.services.minio_service import get_minio_article_service
from app.models.article import Article, Tag, Hashtag
from app.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/v1/api/articles", tags=["Articles"], dependencies=[Depends(get_current_user)])

@router.get("/tags", response_model=List[TagOut])
def get_all_tags(db: Session = Depends(get_db)):
    return db.query(Tag).all()

@router.get("/hashtags", response_model=List[HashtagOut])
def get_all_hashtags(db: Session = Depends(get_db)):
    return db.query(Hashtag).all()

@router.post("/", response_model=ArticleOut)
def create_article_with_media(
    title: str = Form(...),
    embedded_files: List[UploadFile] = File(None),
    attached_files: List[UploadFile] = File(None),
    status: Optional[str] = Form("private"),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    hashtags: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    category_ids: Optional[str] = Form(None),
    subcategory_ids: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    tags_list = str_to_list(tags)
    hashtags_list = str_to_list(hashtags)

    embedded_files = embedded_files or []
    attached_files = attached_files or []

    embedded_files = [f for f in embedded_files if hasattr(f, 'filename')]
    attached_files = [f for f in attached_files if hasattr(f, 'filename')]
    
    def parse_dt(dt_str):
        if not dt_str:
            return None
        try:
            return datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S").isoformat()
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid datetime format, use YYYY-MM-DD HH:MM:SS")

    category_ids_list, subcategory_ids_list = [], []
    if category_ids:
        try:
            category_ids_list = [int(x.strip()) for x in category_ids.split(',') if x.strip()]
        except ValueError:
            raise HTTPException(status_code=422, detail="category_ids must be comma-separated integers")

    if subcategory_ids:
        try:
            subcategory_ids_list = [int(x.strip()) for x in subcategory_ids.split(',') if x.strip()]
        except ValueError:
            raise HTTPException(status_code=422, detail="subcategory_ids must be comma-separated integers")
    
    slug_basic = slugify(title, allow_unicode=True)
    
    article_data = ArticleCreate(
        title=title,
        slug=slug_basic,
        content=content,
        status=status,
        start_date=parse_dt(start_date),
        end_date=parse_dt(end_date),
        tags=tags_list,
        hashtags=hashtags_list,
        category_ids=category_ids_list,
        subcategory_ids=subcategory_ids_list  
    )

    article = create_article_with_categories(db, article_data, category_ids_list, subcategory_ids_list)

    minio_service = get_minio_article_service()
    media_refs = upload_and_attach_media(db, article, embedded_files or [], attached_files or [], minio_service)

    if content:
        article.content = replace_media_placeholders(content, media_refs)

    db.commit()
    db.refresh(article)
    return article

@router.get("/", response_model=List[ArticleOut])
def list_all_articles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return list_articles(db)

@router.get("/{slug:path}", response_model=ArticleOut)
def get_article(slug: str, db: Session = Depends(get_db)):
    article = get_article_by_slug(db, slug)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.put("/{slug:path}", response_model=ArticleOut)
def update_article_route(
    slug: str,
    title: str = Form(...),
    new_slug: str = Form(...),
    content: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    hashtag: Optional[str] = Form(None),
    category_ids: Optional[str] = Form(None),
    subcategory_ids: Optional[str] = Form(None),  # ✅ เพิ่ม subcategory_ids
    media_links: Optional[List[ArticleMediaIn]] = Body(None),
    db: Session = Depends(get_db)
):
    def parse_dt(dt_str):
        if not dt_str:
            return None
        try:
            return datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S").isoformat()
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid datetime format, use YYYY-MM-DD HH:MM:SS")

    tags_list = str_to_list(tags)
    hashtag_list = str_to_list(hashtag)

    # ✅ แปลง category_ids และ subcategory_ids
    category_ids_list, subcategory_ids_list = [], []
    if category_ids:
        try:
            category_ids_list = [int(x.strip()) for x in category_ids.split(',') if x.strip()]
        except ValueError:
            raise HTTPException(status_code=422, detail="category_ids must be comma-separated integers")

    if subcategory_ids:
        try:
            subcategory_ids_list = [int(x.strip()) for x in subcategory_ids.split(',') if x.strip()]
        except ValueError:
            raise HTTPException(status_code=422, detail="subcategory_ids must be comma-separated integers")

    data = ArticleUpdate(
        title=title,
        slug=new_slug,
        content=content,
        status=status,
        start_date=parse_dt(start_date),
        end_date=parse_dt(end_date),
        tags=tags_list,
        hashtags=hashtag_list,
        category_ids=category_ids_list,
        subcategory_ids=subcategory_ids_list  # ✅ เพิ่มตรงนี้
    )

    # ✅ ส่ง subcategory_ids ไปด้วย
    article = update_article_with_categories(db, slug, data, category_ids_list, subcategory_ids_list)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    return article

@router.delete("/{slug:path}")
def delete_article_route(slug: str, db: Session = Depends(get_db)):
    success = delete_article(db, slug)
    if not success:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"detail": "Article deleted"}

@router.post("/comment/{slug:path}", response_model=dict)
def comment_article(
    slug: str,
    comment_data: ArticleCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = get_article_by_slug(db, slug)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    create_or_update_comment(
        db=db,
        article_id=article.id,
        user_id=current_user.id,
        comment_text=comment_data.comment,
        score=comment_data.score
    )
    return {"detail": "Comment submitted successfully"}

@router.get("/comments/{slug:path}", response_model=List[ArticleCommentOut])
def get_article_comments(slug: str, db: Session = Depends(get_db)):
    print("Received slug:", slug)
    article = get_article_by_slug(db, slug)
    if not article:
        print("Article not found for slug:", slug)
        raise HTTPException(status_code=404, detail="Article not found")
    return get_comments_by_article(db, article.id)
