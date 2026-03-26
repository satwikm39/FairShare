import os
import json
from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from google import genai

# Try extracting from pydantic. If using traditional json response, we can just use prompt engineering.
# The new genai SDK expects `gemini-2.5-flash-lite`

def analyze_receipt_with_gemini(file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
    """
    Calls Google Gemini API to analyze an expense document (image).
    Parses the response to extract LineItemExpense fields (Item Name and Price)
    and SummaryFields (Tax).
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
         raise ValueError("GEMINI_API_KEY environment variable is not set")

    client = genai.Client(api_key=api_key)

    prompt = """
    Extract all the distinct items and their prices from this receipt image. 
    Also extract the total tax amount if present.
    Rules:
    - Output must be exactly in valid JSON format.
    - JSON should have two keys: 'items' and 'tax'.
    - 'items' should be a list of objects with 'item_name' (string) and 'unit_cost' (number).
    - 'tax' should be a number (float). If not found, use 0.0.
    - Omit the total amount from standard items, only individual purchased line items.
    """

    response = client.models.generate_content(
        model='gemini-2.5-flash-lite',
        contents=[
            prompt,
            genai.types.Part.from_bytes(data=file_bytes, mime_type=mime_type.split(";")[0] if mime_type else "image/jpeg"),
        ],
        config=genai.types.GenerateContentConfig(
             response_mime_type="application/json"
        )
    )

    try:
        response_json = json.loads(response.text)
        
        parsed_items = []
        for item in response_json.get("items", []):
             try:
                  parsed_items.append({
                       "item_name": str(item.get("item_name", "Unknown Item")),
                       "unit_cost": float(item.get("unit_cost", 0.0))
                  })
             except (ValueError, TypeError):
                  continue
        
        try:
             tax = float(response_json.get("tax", 0.0))
        except (ValueError, TypeError):
             tax = 0.0

        return {
            "items": parsed_items,
            "tax": tax
        }
    except json.JSONDecodeError as e:
        print(f"DEBUG ERROR: Failed to decode Gemini JSON response. Response was: {response.text[:200]}")
        raise ValueError(f"Failed to parse JSON out of Gemini response: {e}")
