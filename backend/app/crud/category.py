from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.category import Category, SubCategory
from app.schemas.category import CategoryCreate, CategoryUpdate, SubCategoryCreate, SubCategoryUpdate

# Category CRUD
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

    update_data = category_data.dict(exclude_unset=True)

    # ตรวจสอบว่า status กำลังจะถูกเปลี่ยนเป็น "private"
    is_status_being_set_to_private = (
        "status" in update_data and update_data["status"] == "private"
    )

    # อัปเดตค่าต่าง ๆ ให้กับ category
    for key, value in update_data.items():
        setattr(category, key, value)

    # ถ้า status ของ category ถูกตั้งเป็น private → ตั้ง subcategories ทั้งหมดเป็น private ด้วย
    if is_status_being_set_to_private:
        for sub in category.subcategories:
            sub.status = "private"

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

# SubCategory CRUD
def get_subcategory_by_id(db: Session, subcategory_id: int):
    return db.query(SubCategory).filter(SubCategory.id == subcategory_id).first()

def get_subcategories_by_category_id(db: Session, category_id: int):
    return db.query(SubCategory).filter(SubCategory.category_id == category_id).all()

def create_subcategory(db: Session, subcategory: SubCategoryCreate):
    category = db.query(Category).filter(Category.id == subcategory.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if category.status == "private" and subcategory.status == "public":
        raise HTTPException(
            status_code=400,
            detail="Cannot set subcategory to public when its category is private"
        )

    db_subcategory = SubCategory(**subcategory.dict())
    db.add(db_subcategory)
    db.commit()
    db.refresh(db_subcategory)
    return db_subcategory

def update_subcategory(db: Session, subcategory_id: int, subcategory_data: SubCategoryUpdate):
    subcategory = get_subcategory_by_id(db, subcategory_id)
    if not subcategory:
        return None

    new_status = subcategory_data.status or subcategory.status

    category = subcategory.category 

    if category.status == "private" and new_status == "public":
        raise HTTPException(
            status_code=400,
            detail="Cannot set subcategory to public when its category is private"
        )

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
