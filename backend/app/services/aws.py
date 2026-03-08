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
textract_client = boto3.client("textract", region_name=AWS_REGION)

def upload_image_to_s3(file_content: bytes, filename: str) -> str:
    """
    Uploads an image to the configured S3 bucket and returns the object key.
    """
    if not S3_BUCKET_NAME:
        raise ValueError("S3_BUCKET_NAME environment variable is not set")

    # Generate a unique filename to prevent collisions
    unique_filename = f"{uuid.uuid4()}-{filename}"
    
    s3_client.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=unique_filename,
        Body=file_content,
        ContentType="image/jpeg" # Assuming JPEG but this could be dynamic
    )
    
    # Return the S3 URL (assuming bucket is somewhat accessible, or just the key for frontend)
    # Using the key is safer, but returning a formatted URL is common
    return unique_filename

def analyze_receipt_with_textract(s3_object_key: str) -> List[Dict[str, Any]]:
    """
    Calls AWS Textract to analyze an expense document residing in S3.
    Parses the response to extract LineItemExpense fields (Item Name and Price).
    """
    if not S3_BUCKET_NAME:
        raise ValueError("S3_BUCKET_NAME environment variable is not set")

    response = textract_client.analyze_expense(
        Document={
            'S3Object': {
                'Bucket': S3_BUCKET_NAME,
                'Name': s3_object_key
            }
        }
    )
    
    parsed_items = []
    
    # Parse Textract output
    for expense_doc in response.get("ExpenseDocuments", []):
        for line_item_group in expense_doc.get("LineItemGroups", []):
            for line_item in line_item_group.get("LineItems", []):
                item_name = "Unknown Item"
                unit_cost = 0.0
                
                for expense_field in line_item.get("LineItemExpenseFields", []):
                    field_type = expense_field.get("Type", {}).get("Text")
                    field_value = expense_field.get("ValueDetection", {}).get("Text")
                    
                    if field_type == "ITEM":
                        item_name = field_value
                    elif field_type == "PRICE":
                        try:
                            # Clean up price string (e.g. "$12.99" -> 12.99)
                            clean_price = field_value.replace("$", "").replace(",", "")
                            unit_cost = float(clean_price)
                        except ValueError:
                            # If parsing fails, default to 0.0
                            pass
                
                # Only add if we found a valid price or it seems like a real item
                if unit_cost > 0 or item_name != "Unknown Item":
                    parsed_items.append({
                        "item_name": item_name,
                        "unit_cost": unit_cost
                    })

    return parsed_items
