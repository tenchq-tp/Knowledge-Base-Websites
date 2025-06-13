from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.routes import auth, profiles, user, category, user_setting, role, permission, role_permission, article
from app.db.database import engine, Base
from app.core.logging import setup_logging
from app.middleware.security import SecurityHeadersMiddleware
from app.middleware.security import RateLimitMiddleware
from datetime import datetime

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
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info", access_log=True)