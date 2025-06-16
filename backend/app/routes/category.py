from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
import app.crud.category as crud
import app.schemas.category as schemas
from app.routes.auth import get_current_user  # Adjust the import path as needed
from app.models.user import User

router = APIRouter(prefix="/v1/api/categories", tags=["Categories"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=list[schemas.CategoryResponse])
def read_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
    ):
    return crud.get_all_category(db)

@router.get("/{category_id}", response_model=schemas.CategoryResponse)
def read_category(
    category_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = crud.get_category_by_id(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.post("/", response_model=schemas.CategoryResponse)
def create_category(
    category: schemas.CategoryCreate, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud.create_category(db, category)

@router.put("/{category_id}", response_model=schemas.CategoryResponse)
def update_category(
    category_id: int, category: schemas.CategoryUpdate, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated = crud.update_category(db, category_id, category)
    if not updated:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated

@router.delete("/{category_id}", response_model=schemas.CategoryResponse)
def delete_category(
    category_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deleted = crud.delete_category(db, category_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Category not found")
    return deleted

@router.get("/subcategory/{subcategory_id}", response_model=schemas.SubCategoryResponse)
def get_subcategory_by_id(
    subcategory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subcategory = crud.get_subcategory_by_id(db, subcategory_id)
    if not subcategory:
        raise HTTPException(status_code=404, detail="SubCategory not found")
    return subcategory

@router.post("/subcategory/", response_model=schemas.SubCategoryResponse)
def create_subcategory(
    subcategory: schemas.SubCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.create_subcategory(db, subcategory)


@router.put("/subcategory/{subcategory_id}", response_model=schemas.SubCategoryResponse)
def update_subcategory(
    subcategory_id: int,
    subcategory: schemas.SubCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = crud.update_subcategory(db, subcategory_id, subcategory)
    if not updated:
        raise HTTPException(status_code=404, detail="SubCategory not found")
    return updated


@router.delete("/subcategory/{subcategory_id}", response_model=schemas.SubCategoryResponse)
def delete_subcategory(
    subcategory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = crud.delete_subcategory(db, subcategory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="SubCategory not found")
    return deleted