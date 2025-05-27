from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    # ใช้ตัวแปรที่ตรงกับใน docker-compose
    DATABASE_URL: str = "postgresql://admin:admin123@db:5432/kbdb"
    SECRET_KEY: str = "123456"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "allow"
    }

    @property
    def database_url(self):
        """Backward compatibility"""
        return self.DATABASE_URL
    
    @property 
    def secret_key(self):
        """Backward compatibility"""
        return self.SECRET_KEY
    
    @property
    def access_token_expire_minutes(self):
        """Backward compatibility"""
        return self.ACCESS_TOKEN_EXPIRE_MINUTES
    
    @property
    def algorithm(self):
        """Backward compatibility"""
        return self.ALGORITHM

# สร้าง instance
settings = Settings()