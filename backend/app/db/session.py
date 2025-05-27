from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
from typing import Generator
import logging
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create engine with connection pooling
engine = create_engine(
    settings.database_url,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600,   # Recycle connections every hour
    echo=False  # Set to True for SQL debugging
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Event listeners for connection monitoring
@event.listens_for(engine, "connect")
def receive_connect(dbapi_connection, connection_record):
    logger.info("New database connection established")

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    logger.debug("Connection checked out from pool")

@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    logger.debug("Connection returned to pool")

def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """
    Context manager for database sessions
    Usage: 
        with get_db_context() as db:
            # perform database operations
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        logger.error(f"Database transaction error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

class DatabaseManager:
    """
    Database manager class for advanced operations
    """
    
    @staticmethod
    def health_check() -> bool:
        """
        Check database connection health
        """
        try:
            with get_db_context() as db:
                db.execute("SELECT 1")
                return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    @staticmethod
    def get_connection_info() -> dict:
        """
        Get database connection information
        """
        try:
            pool = engine.pool
            return {
                "pool_size": pool.size(),
                "checked_out_connections": pool.checkedout(),
                "overflow_connections": pool.overflow(),
                "checked_in_connections": pool.checkedin()
            }
        except Exception as e:
            logger.error(f"Failed to get connection info: {e}")
            return {}

# Create database manager instance
db_manager = DatabaseManager()

# Export commonly used items
__all__ = [
    "engine",
    "SessionLocal", 
    "get_db",
    "get_db_context",
    "db_manager"
]