from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.routes import auth, profiles, user, category, user_setting, role, permission, role_permission, article
from app.db.database import engine, Base, SessionLocal
from sqlalchemy.orm import Session
from app.models.permission import Permission
from app.core.logging import setup_logging
from app.middleware.security import SecurityHeadersMiddleware
from app.middleware.security import RateLimitMiddleware
from datetime import datetime
import uvicorn

# Setup custom logging
logger, security_logger = setup_logging()

try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Error creating database tables: {e}")

app = FastAPI(
    title="Secure User Management API",
    version="2.0.0",
    description="FastAPI User Management System with Enhanced Security",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)
app.add_middleware(SecurityHeadersMiddleware)
# app.add_middleware(RateLimitMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "*.yourdomain.com"])
app.add_middleware(GZipMiddleware, minimum_size=1000)

PERMISSIONS = [
    ("view_home", "View Home Page"),
    ("add_home", "Add Home Page"),
    ("read_home", "Read Home Page"),
    ("edit_home", "Edit Home Page"),
    ("delete_home", "Delete Home Page"),
    ("view_dashboard", "View Dashboard Page"),
    ("add_dashboard", "Add Dashboard Page"),
    ("read_dashboard", "Read Dashboard Page"),
    ("edit_dashboard", "Edit Dashboard Page"),
    ("delete_dashboard", "Delete Dashboard Page"),
    ("view_category", "View Category"),
    ("add_category", "Add Category"),
    ("read_category", "Read Category"),
    ("edit_category", "Edit Category"),
    ("delete_category", "Delete Category"),
    ("view_profile", "View Profile"),
    ("add_profile", "Add Profile"),
    ("read_profile", "Read Profile"),
    ("edit_profile", "Edit Profile"),
    ("delete_profile", "Delete Profile"),
    ("user_setting", "View Settings"),
    ("role_setting", "Add Settings"),
]

def seed_permissions(db: Session):
    for name, description in PERMISSIONS:
        exists = db.query(Permission).filter_by(name=name).first()
        if not exists:
            perm = Permission(name=name, description=description)
            db.add(perm)
    db.commit()
    
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        seed_permissions(db)  # <<-- seed permissions ที่คุณต้องการ
    finally:
        db.close()
        
# Include routers
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(user.router)
app.include_router(user_setting.router)
app.include_router(role.router)
app.include_router(permission.router)
app.include_router(role_permission.router)
app.include_router(category.router)
app.include_router(article.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info", access_log=True)
    
