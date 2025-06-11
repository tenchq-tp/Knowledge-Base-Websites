from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path="/backend/.env")

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str 
    ACCESS_TOKEN_EXPIRE_MINUTES: int 
    ALGORITHM: str

    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_SECURE: bool = False
    
    MINIO_ARTICLE_BUCKET: str
    MINIO_AVATAR_BUCKET: str
    
    class Config:
        env_file = "/backend/.env"
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