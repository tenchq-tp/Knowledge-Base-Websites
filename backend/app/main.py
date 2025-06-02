from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.routes import auth, profiles, user, category, user_setting, role, permission, feature, role_permission
from app.db.database import engine, Base
from app.core.logging import setup_logging
from app.middleware.security import SecurityHeadersMiddleware
from app.middleware.security import RateLimitMiddleware
from datetime import datetime

# Setup custom logging
logger, security_logger = setup_logging()

# Create tables
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
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, calls=100, period=3600)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "*.yourdomain.com"])
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(user.router)
app.include_router(user_setting.router)
app.include_router(role.router)
app.include_router(permission.router)
app.include_router(feature.router)
app.include_router(role_permission.router)
app.include_router(category.router)

@app.get("/")
async def root():
    return {
        "message": "Secure User Management API v2.0",
        "features": [
            "Enhanced Security with Argon2 password hashing",
            "Secure session management with hashed tokens",
            "User profiles with data validation",
            "Comprehensive audit trails"
        ],
        "security_features": [
            "Password strength validation",
            "Email verification",
            "Session token hashing",
            "Rate limiting ready",
            "Audit logging"
        ],
        "endpoints": {
            "docs": "/docs",
            "auth": "/auth",
            "profiles": "/profiles", 
            "user": "/user",
            "category": "/categories"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        from app.db.database import SessionLocal
        from sqlalchemy import text
        with SessionLocal() as db:
            result = db.execute(text("SELECT 1"))
            return {
                "status": "healthy",
                "database": "connected",
                "timestamp": datetime.utcnow().isoformat()
            }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info", access_log=True)