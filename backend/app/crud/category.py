from sqlalchemy.orm import Session 
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate

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

