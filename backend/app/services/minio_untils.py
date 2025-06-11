from minio import Minio
from datetime import timedelta
import os

minio_client = Minio(
    endpoint=os.getenv("MINIO_ENDPOINT"),
    access_key=os.getenv("MINIO_ACCESS_KEY"),
    secret_key=os.getenv("MINIO_SECRET_KEY"),
    secure=False  # เปลี่ยนเป็น True ถ้าใช้ https
)

def generate_signed_url(bucket: str, object_name: str, expiry_minutes: int = 10):
    return minio_client.presigned_get_object(
        bucket_name=bucket,
        object_name=object_name,
        expires=timedelta(minutes=expiry_minutes)
    )
