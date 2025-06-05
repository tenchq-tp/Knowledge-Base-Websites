from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.session import db_manager

router = APIRouter(prefix="/health", tags=["Health Check"])

@router.get("/")
def health_check():
    return {"status": "healthy", "message": "API is running"}

@router.get("/db")
def database_health_check(db: Session = Depends(get_db)):
    try:
        # Test database connection
        db.execute("SELECT 1")
        db_health = db_manager.health_check()
        connection_info = db_manager.get_connection_info()
        
        return {
            "status": "healthy" if db_health else "unhealthy",
            "database": "connected" if db_health else "disconnected",
            "connection_pool": connection_info
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }