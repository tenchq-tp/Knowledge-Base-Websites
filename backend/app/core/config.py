from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str 
    ACCESS_TOKEN_EXPIRE_MINUTES: int 
    ALGORITHM: str

    minio_endpoint: str
    minio_access_key: str
    minio_secret_key: str
    minio_bucket: str
    minio_secure: bool = False
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def database_url(self):
        return self.DATABASE_URL
    
    @property 
    def secret_key(self):
        return self.SECRET_KEY
    
    @property
    def access_token_expire_minutes(self):
        return self.ACCESS_TOKEN_EXPIRE_MINUTES
    
    @property
    def algorithm(self):
        return self.ALGORITHM

settings = Settings()