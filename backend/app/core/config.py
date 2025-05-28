from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str 
    ACCESS_TOKEN_EXPIRE_MINUTES: int 
    ALGORITHM: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

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