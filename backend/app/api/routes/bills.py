from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, crud, models
from app.core.database import get_db
from fastapi import UploadFile, File
from app.api import deps
import app.services.aws as aws_service

router = APIRouter()

@router.get("/{bill_id}", response_model=schemas.Bill)
def read_bill(bill_id: int, db: Session = Depends(get_db)):
    db_bill = crud.bills.get_bill(db, bill_id=bill_id)
    if db_bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")
    return db_bill

@router.delete("/{bill_id}", status_code=204)
def delete_bill(
    bill_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    db_bill = crud.bills.delete_bill(db=db, bill_id=bill_id)
    if db_bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")
    return None

@router.post("/{bill_id}/items/", response_model=schemas.BillItem)
def create_item_for_bill(bill_id: int, item: schemas.BillItemCreate, db: Session = Depends(get_db)):
    db_bill = crud.bills.get_bill(db, bill_id=bill_id)
    if db_bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")
    return crud.bills.create_bill_item(db=db, bill_id=bill_id, item=item)

@router.post("/items/{item_id}/shares/", response_model=schemas.ItemShare)
def add_share_to_item(item_id: int, share: schemas.ItemShareCreate, db: Session = Depends(get_db)):
    # Validate user exists
    db_user = crud.users.get_user(db, user_id=share.user_id)
    if db_user is None:
         raise HTTPException(status_code=404, detail="User not found")
    return crud.bills.add_item_share(db=db, item_id=item_id, share=share)

@router.post("/{bill_id}/upload-receipt", response_model=list[schemas.BillItem])
async def upload_receipt(
    bill_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    print(f"DEBUG: Upload route called for bill_id: {bill_id}")
    # 1. Check if bill exists
    db_bill = crud.bills.get_bill(db, bill_id=bill_id)
    if db_bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")

    # 2. Upload file to S3
    try:
        contents = await file.read()
        s3_key = aws_service.upload_image_to_s3(contents, file.filename, content_type=file.content_type)
        print(f"DEBUG: S3 Upload success. Key: {s3_key}")
    except Exception as e:
         print(f"DEBUG ERROR: S3 Upload failed: {e}")
         raise HTTPException(status_code=500, detail=f"Failed to upload image to S3: {str(e)}")

    # Update bill's receipt_image_url
    if s3_key:
        crud.bills.update_bill(db=db, bill_id=bill_id, receipt_image_url=s3_key)

    # 3. Analyze with Textract
    try:
        print(f"DEBUG: Calling Textract service")
        parsed_items = aws_service.analyze_receipt_with_textract(s3_key)
        print(f"DEBUG: Textract returned {len(parsed_items)} items")
    except Exception as e:
         print(f"DEBUG ERROR: Textract failed: {e}")
         raise HTTPException(status_code=500, detail=f"Failed to parse image with Textract: {str(e)}")

    # 4. Save items to DB
    saved_items = []
    for item_data in parsed_items:
        try:
            item_create = schemas.BillItemCreate(
                item_name=item_data["item_name"],
                unit_cost=item_data["unit_cost"]
            )
            saved_item = crud.bills.create_bill_item(db=db, bill_id=bill_id, item=item_create)
            saved_items.append(saved_item)
            print(f"DEBUG: Successfully saved item to DB: {saved_item.id}")
        except Exception as e:
            print(f"DEBUG ERROR: Failed to save item to DB: {e}")

    print(f"DEBUG: Returning {len(saved_items)} items to frontend")
    return saved_items
