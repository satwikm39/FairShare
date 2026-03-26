import boto3
import uuid
import os
import json
from typing import List, Dict, Any

# Ensure regions are consistent.
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# Boto3 clients will automatically pick up AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
# from the environment variables natively, provided they are loaded (e.g., via dotenv).
s3_client = boto3.client("s3", region_name=AWS_REGION)

import mimetypes

def upload_image_to_s3(file_content: bytes, filename: str, content_type: str = None) -> str:
    """
    Uploads an image to the configured S3 bucket and returns the object key.
    """
    if not S3_BUCKET_NAME:
        raise ValueError("S3_BUCKET_NAME environment variable is not set")

    if not content_type:
        content_type, _ = mimetypes.guess_type(filename)
        if not content_type:
            content_type = "application/octet-stream"

    # Generate a unique filename to prevent collisions
    unique_filename = f"{uuid.uuid4()}-{filename}"
    
    s3_client.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=unique_filename,
        Body=file_content,
        ContentType=content_type
    )
    
    # Return the S3 URL (assuming bucket is somewhat accessible, or just the key for frontend)
    # Using the key is safer, but returning a formatted URL is common
    return unique_filename



