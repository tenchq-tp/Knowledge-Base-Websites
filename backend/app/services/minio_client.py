from minio import Minio
from fastapi import UploadFile
import os
import uuid

minio_client = Minio(
    os.getenv("MINIO_ENDPOINT"),
    access_key=os.getenv("MINIO_ACCESS_KEY"),
    secret_key=os.getenv("MINIO_SECRET_KEY"),
    secure=False
)

bucket = os.getenv("MINIO_BUCKET")

if not minio_client.bucket_exists(bucket):
    minio_client.make_bucket(bucket)

def upload_file(file: UploadFile):
    ext = file.filename.split('.')[-1]
    object_name = f"{uuid.uuid4()}.{ext}"
    minio_client.put_object(
        bucket,
        object_name,
        file.file,
        length=-1,
        part_size=10 * 1024 * 1024,
        content_type=file.content_type
    )
    return f"http://{os.getenv('MINIO_ENDPOINT')}/{bucket}/{object_name}"
