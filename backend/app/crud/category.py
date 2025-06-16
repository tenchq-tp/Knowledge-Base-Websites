from sqlalchemy.orm import Session 
from app.models.category import Category, SubCategory
from app.schemas.category import CategoryCreate, CategoryUpdate, SubCategoryCreate, SubCategoryUpdate

def get_all_category(db: Session):
    return db.query(Category).all()

def get_category_by_id(db: Session, category_id: int):
    return db.query(Category).filter(Category.id == category_id).first()

def create_category(db: Session, category: CategoryCreate):
    db_category = Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: int, category_data: CategoryUpdate):
    category = get_category_by_id(db, category_id)
    if not category:
        return None
    for key, value in category_data.dict(exclude_unset=True).items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category

def delete_category(db: Session, category_id: int):
    category = get_category_by_id(db, category_id)
    if not category:
        return None

    db.delete(category)
    db.commit()
    return category

def get_subcategory_by_id(db: Session, subcategory_id: int):
    return db.query(SubCategory).filter(SubCategory.id == subcategory_id).first()

def get_subcategories_by_category_id(db: Session, category_id: int):
    return db.query(SubCategory).filter(SubCategory.category_id == category_id).all()

def create_subcategory(db: Session, subcategory: SubCategoryCreate):
    db_subcategory = SubCategory(**subcategory.dict())
    db.add(db_subcategory)
    db.commit()
    db.refresh(db_subcategory)
    return db_subcategory

def update_subcategory(db: Session, subcategory_id: int, subcategory_data: SubCategoryUpdate):
    subcategory = get_subcategory_by_id(db, subcategory_id)
    if not subcategory:
        return None
    for key, value in subcategory_data.dict(exclude_unset=True).items():
        setattr(subcategory, key, value)
    db.commit()
    db.refresh(subcategory)
    return subcategory

def delete_subcategory(db: Session, subcategory_id: int):
    subcategory = get_subcategory_by_id(db, subcategory_id)
    if not subcategory:
        return None
    db.delete(subcategory)
    db.commit()
    return subcategory