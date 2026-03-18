from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app import schemas, crud, models
from app.api.deps import get_current_user, get_db, get_current_bill_access
import app.services.aws as aws_service

router = APIRouter()

@router.get("/{bill_id}", response_model=schemas.Bill)
def read_bill(
    bill_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_bill_access)
):
    db_bill = crud.bills.get_bill(db, bill_id=bill_id)
    return db_bill

@router.put("/{bill_id}", response_model=schemas.Bill)
def update_bill_details(
    bill_id: int, 
    bill_update: schemas.BillUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_bill_access)
):
    db_bill = crud.bills.get_bill(db, bill_id=bill_id)
    if db_bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    update_data = bill_update.model_dump(exclude_unset=True)
    group_id = db_bill.group_id
    result = crud.bills.update_bill(db=db, bill_id=bill_id, **update_data)

    # Recompute cached debts if the payer changed
    if "paid_by_user_id" in update_data:
        from app.services.debts import recompute_group_debts
        recompute_group_debts(db, group_id)

    return result

@router.delete("/{bill_id}", status_code=204)
def delete_bill(
    bill_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_bill_access)
):
    db_bill = crud.bills.delete_bill(db=db, bill_id=bill_id)
    if db_bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")
    return None

@router.delete("/{bill_id}/members/{user_id}", status_code=204)
def remove_user_from_bill(
    bill_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_bill_access)
):
    """Remove all shares for a user from every item in this bill."""
    db_bill = crud.bills.get_bill(db, bill_id=bill_id)
    if db_bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")

    crud.bills.remove_user_from_bill(db=db, bill_id=bill_id, user_id=user_id)

    # Recompute group debts since share distribution changed
    from app.services.debts import recompute_group_debts
    recompute_group_debts(db, db_bill.group_id)
    return None

@router.post("/{bill_id}/items/", response_model=schemas.BillItem)
def create_item_for_bill(
    bill_id: int, 
    item: schemas.BillItemCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_bill_access)
):
    return crud.bills.create_bill_item(db=db, bill_id=bill_id, item=item)

@router.post("/items/{item_id}/shares/", response_model=schemas.ItemShare)
def add_share_to_item(
    item_id: int, 
    share: schemas.ItemShareCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Global auth enough, but could check group membership too if needed.
):
    # Validate user exists
    db_user = crud.users.get_user(db, user_id=share.user_id)
    if db_user is None:
         raise HTTPException(status_code=404, detail="User not found")
    return crud.bills.add_item_share(db=db, item_id=item_id, share=share)

@router.put("/items/{item_id}", response_model=schemas.BillItem)
def update_item_details(
    item_id: int, 
    item_update: schemas.BillItemUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_item = crud.bills.update_bill_item(db=db, item_id=item_id, item_update=item_update)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Bill item not found")
    return db_item

@router.delete("/items/{item_id}", status_code=204)
def delete_item(
    item_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_item = crud.bills.delete_bill_item(db=db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Bill item not found")
    return None

@router.post("/{bill_id}/shares/bulk", response_model=list[schemas.ItemShare])
def update_shares_bulk(
    bill_id: int, 
    shares: list[schemas.ItemShareUpdateBulk], 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_bill_access)
):
    db_bill = crud.bills.get_bill(db, bill_id=bill_id)
    if db_bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    result = crud.bills.add_item_shares_bulk(db=db, bill_id=bill_id, shares=shares)

    # Recompute cached debts when shares change
    from app.services.debts import recompute_group_debts
    recompute_group_debts(db, db_bill.group_id)

    return result

@router.post("/{bill_id}/upload-receipt", response_model=list[schemas.BillItem])
async def upload_receipt(
    bill_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_bill_access)
):
    print(f"DEBUG: Upload route called for bill_id: {bill_id}")
    
    # Check Textract usage limit
    if current_user.textract_usage_count >= 2:
        raise HTTPException(
            status_code=403, 
            detail="Textract limit reached. Premium features coming soon!"
        )
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
        parsed_data = aws_service.analyze_receipt_with_textract(s3_key)
        parsed_items = parsed_data.get("items", [])
        extracted_tax = parsed_data.get("tax", 0.0)
        print(f"DEBUG: Textract returned {len(parsed_items)} items and ${extracted_tax} tax")
        
        # Update the bill with the extracted tax *before* saving items 
        # so recalculate_bill_totals will use the new tax
        if extracted_tax > 0:
            crud.bills.update_bill(db=db, bill_id=bill_id, total_tax=extracted_tax)
            
    except Exception as e:
         print(f"DEBUG ERROR: Textract failed: {e}")
         raise HTTPException(status_code=500, detail=f"Failed to parse image with Textract: {str(e)}")

    # Increment usage count on success
    current_user.textract_usage_count += 1
    db.add(current_user)
    db.commit()

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
