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

def analyze_receipt_with_textract(s3_object_key: str) -> List[Dict[str, Any]]:
    """
    Calls AWS Textract to analyze an expense document residing in S3.
    Parses the response to extract LineItemExpense fields (Item Name and Price).
    """
    if not S3_BUCKET_NAME:
        raise ValueError("S3_BUCKET_NAME environment variable is not set")

    print(f"DEBUG: Calling analyze_expense for S3 object: {s3_object_key} in bucket {S3_BUCKET_NAME}")
    response = textract_client.analyze_expense(
        Document={
            'S3Object': {
                'Bucket': S3_BUCKET_NAME,
                'Name': s3_object_key
            }
        }
    )
    print(f"DEBUG: Received response from Textract. Response summary: {json.dumps({k: type(v).__name__ for k, v in response.items()})}")
    
    parsed_items = []
    
    # Parse Textract output
    expense_docs = response.get("ExpenseDocuments", [])
    print(f"DEBUG: Found {len(expense_docs)} ExpenseDocuments")
    
    for doc_idx, expense_doc in enumerate(expense_docs):
        line_item_groups = expense_doc.get("LineItemGroups", [])
        print(f"DEBUG: Doc {doc_idx} has {len(line_item_groups)} LineItemGroups")
        
        for group_idx, line_item_group in enumerate(line_item_groups):
            line_items = line_item_group.get("LineItems", [])
            print(f"DEBUG: Group {group_idx} has {len(line_items)} LineItems")
            
            for item_idx, line_item in enumerate(line_items):
                item_name = "Unknown Item"
                unit_cost = 0.0
                
                expense_fields = line_item.get("LineItemExpenseFields", [])
                print(f"DEBUG: Item {item_idx} has {len(expense_fields)} ExpenseFields")
                
                for expense_field in expense_fields:
                    field_type = expense_field.get("Type", {}).get("Text")
                    field_value = expense_field.get("ValueDetection", {}).get("Text")
                    print(f"DEBUG: Field Type: {field_type}, Value: {field_value}")
                    
                    if field_type == "ITEM":
                        item_name = field_value
                    elif field_type == "PRICE":
                        try:
                            # Clean up price string (e.g. "$12.99" -> 12.99)
                            clean_price = field_value.replace("$", "").replace(",", "")
                            unit_cost = float(clean_price)
                        except ValueError:
                            print(f"DEBUG: Failed to parse price: {field_value}")
                            # If parsing fails, default to 0.0
                            pass
                
                print(f"DEBUG: Parsed Item: {item_name} at ${unit_cost}")
                # Only add if we found a valid price or it seems like a real item
                if unit_cost > 0 or item_name != "Unknown Item":
                    parsed_items.append({
                        "item_name": item_name,
                        "unit_cost": unit_cost
                    })

    print(f"DEBUG: Total parsed items returned: {len(parsed_items)}")
    return parsed_items

