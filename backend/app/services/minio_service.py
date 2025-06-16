from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile
import uuid
from pathlib import Path
from PIL import Image
import io
import json
import os
from typing import Optional
from functools import lru_cache
from dotenv import load_dotenv
load_dotenv()

class MinIOServiceBase:
    def __init__(self, endpoint: str, access_key: str, secret_key: str,
                 bucket: str, secure: bool = False):
        self.endpoint = endpoint
        self.access_key = access_key
        self.secret_key = secret_key
        self.bucket = bucket

        self.client = Minio(
            self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=secure
        )
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except S3Error as e:
            print(f"Error creating bucket {self.bucket}: {e}")

    def delete_object(self, object_name: str) -> bool:
        try:
            self.client.remove_object(self.bucket, object_name)
            return True
        except S3Error as e:
            print(f"Error deleting object {object_name}: {e}")
            return False

    def get_public_url(self, object_name: str) -> str:
        public_host = os.getenv("MINIO_PUBLIC_HOST", self.endpoint)
        print("DEBUG - public_host:", public_host)
        # return f"http://{public_host}/{self.bucket}/{object_name}"
        return f"http://localhost:9001/api/v1/buckets/{self.bucket}/objects/download?preview=true&prefix={object_name}&version_id=null"

class MinIOAvatarService(MinIOServiceBase):
    def __init__(self, **kwargs):
        # ใช้ bucket default เป็น user-avatars ถ้าไม่กำหนด
        kwargs.setdefault("bucket", os.getenv("MINIO_AVATAR_BUCKET", "user-avatars"))
        super().__init__(**kwargs)

    def upload_avatar(self, user_id: int, file: UploadFile) -> str:
        ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        object_name = f"user_{user_id}%2F{uuid.uuid4()}.{ext}"

        try:
            self.client.put_object(
                self.bucket,
                object_name,
                file.file,
                length=-1,
                part_size=10 * 1024 * 1024,
                content_type=file.content_type
            )
            print(str(self))
            return self.get_public_url(object_name)
        except S3Error as e:
            raise Exception(f"Failed to upload avatar: {e}")

    def upload_avatar_from_bytes(self, user_id: int, file_content: bytes, filename: str, content_type: str) -> tuple[str, str]:
        file_extension = Path(filename).suffix.lower() or '.jpg'
        object_name = f"user_{user_id}/{uuid.uuid4()}{file_extension}"

        try:
            self.client.put_object(
                bucket_name=self.bucket,
                object_name=object_name,
                data=io.BytesIO(file_content),
                length=len(file_content),
                content_type=content_type
            )
            return object_name, self.get_public_url(object_name)
        except S3Error as e:
            raise Exception(f"Failed to upload avatar: {e}")
        
    def delete_avatar(self, avatar_url: str) -> bool:
        from urllib.parse import urlparse

        try:
            parsed_url = urlparse(avatar_url)
            object_path = parsed_url.query.split("prefix=")[-1].split("&")[0]
            return self.delete_object(object_path)
        except Exception as e:
            print(f"Error parsing or deleting avatar: {e}")
            return False

# class MinIOArticleService(MinIOServiceBase):
#     def __init__(self, **kwargs):
#         # ใช้ bucket default เป็น articles ถ้าไม่กำหนด
#         kwargs.setdefault("bucket", os.getenv("MINIO_ARTICLE_BUCKET", "articles"))
#         super().__init__(**kwargs)

#     def upload_article_file(self, file: UploadFile) -> str:
#         ext = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
#         object_name = f"articles/{uuid.uuid4()}.{ext}"

#         try:
#             self.client.put_object(
#                 self.bucket,
#                 object_name,
#                 file.file,
#                 length=-1,
#                 part_size=10 * 1024 * 1024,
#                 content_type=file.content_type
#             )
#             return self.get_public_url(object_name)
#         except S3Error as e:
#             raise Exception(f"Failed to upload article file: {e}")

class MinIOArticleService(MinIOServiceBase):
    def __init__(self, **kwargs):
        kwargs.setdefault("bucket", os.getenv("MINIO_ARTICLE_BUCKET", "articles"))
        super().__init__(**kwargs)

    def upload_embedded_file(self, article_id: int, file: UploadFile) -> str:
        # ดึงนามสกุลไฟล์แบบ `.jpg`, `.png`, ฯลฯ
        ext = os.path.splitext(file.filename)[1] or ".bin"
        object_name = f"article_{article_id}/embedded/{uuid.uuid4()}{ext}"

        try:
            self.client.put_object(
                self.bucket,
                object_name,
                file.file,
                length=-1,
                part_size=10 * 1024 * 1024,
                content_type=file.content_type
            )
            return self.get_public_url(object_name)
        except S3Error as e:
            raise Exception(f"Failed to upload embedded file: {e}")

    def upload_attached_file(self, article_id: int, file: UploadFile) -> str:
        ext = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
        object_name = f"article_{article_id}/attached/{uuid.uuid4()}.{ext}"

        try:
            self.client.put_object(
                self.bucket,
                object_name,
                file.file,
                length=-1,
                part_size=10 * 1024 * 1024,
                content_type=file.content_type
            )
            return self.get_public_url(object_name)
        except S3Error as e:
            raise Exception(f"Failed to upload attached file: {e}")

@lru_cache()
def get_minio_avatar_service() -> MinIOAvatarService:
    return MinIOAvatarService(
        endpoint=os.getenv("MINIO_ENDPOINT", "localhost:9000"),
        access_key=os.getenv("MINIO_ACCESS_KEY", "admin"),
        secret_key=os.getenv("MINIO_SECRET_KEY", "admin123"),
        secure=os.getenv("MINIO_SECURE", "false").lower() == "true"
    )

@lru_cache()
def get_minio_article_service() -> MinIOArticleService:
    return MinIOArticleService(
        endpoint=os.getenv("MINIO_ENDPOINT", "localhost:9000"),
        access_key=os.getenv("MINIO_ACCESS_KEY", "admin"),
        secret_key=os.getenv("MINIO_SECRET_KEY", "admin123"),
        secure=os.getenv("MINIO_SECURE", "false").lower() == "true"
    )

def validate_avatar_image(file_content: bytes, max_size_mb: int = 5) -> tuple[bool, str, Optional[tuple]]:
    if len(file_content) > max_size_mb * 1024 * 1024:
        return False, f"Avatar size exceeds {max_size_mb}MB", None

    try:
        image = Image.open(io.BytesIO(file_content))
        width, height = image.size

        if image.format not in ['JPEG', 'PNG', 'GIF', 'WEBP']:
            return False, "Unsupported image format. Please use JPEG, PNG, GIF, or WEBP", None

        if width < 50 or height < 50:
            return False, "Avatar image too small. Minimum size is 50x50 pixels", None

        return True, "", (width, height)

    except Exception as e:
        return False, f"Invalid image file: {str(e)}", None

def resize_avatar(file_content: bytes, max_width: int = 400, max_height: int = 400, quality: int = 85) -> bytes:
    try:
        image = Image.open(io.BytesIO(file_content))

        ratio = min(max_width / image.width, max_height / image.height)
        if ratio < 1:
            new_size = (int(image.width * ratio), int(image.height * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)

        output = io.BytesIO()
        format = image.format if image.format in ['JPEG', 'PNG'] else 'JPEG'

        if format == 'JPEG':
            image = image.convert('RGB')
            image.save(output, format=format, quality=quality, optimize=True)
        else:
            image.save(output, format=format, optimize=True)

        return output.getvalue()

    except Exception as e:
        raise Exception(f"Failed to resize avatar: {str(e)}")
