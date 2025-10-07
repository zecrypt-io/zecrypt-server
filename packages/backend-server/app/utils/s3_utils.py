import boto3
from app.core.config import settings


# DigitalOcean Spaces config
session = boto3.session.Session()
client = session.client(
    "s3",
    region_name=settings.DO_SPACES_REGION,
    endpoint_url=f"https://{settings.DO_SPACES_REGION}.digitaloceanspaces.com",
    aws_access_key_id=settings.DO_SPACES_KEY,
    aws_secret_access_key=settings.DO_SPACES_SECRET,
)

BUCKET_NAME = settings.DO_SPACES_BUCKET


def generate_upload_url(file_name,expires_in=3600):
    try:
        url = client.generate_presigned_url(
            "put_object",
            Params={"Bucket": BUCKET_NAME, "Key": file_name},
            ExpiresIn=expires_in,
        )
        return {"upload_url": url}
    except Exception as e:
        return {"error": str(e)}

def generate_download_url(file_name,expires_in=3600):
    try:
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET_NAME, "Key": file_name},
            ExpiresIn=expires_in,
        )
        return {"download_url": url}
    except Exception as e:
        return {"error": str(e)}