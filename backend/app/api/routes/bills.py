from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, crud
from app.core.database import get_db

router = APIRouter()

@router.get("/{bill_id}", response_model=schemas.Bill)
def read_bill(bill_id: int, db: Session = Depends(get_db)):
    db_bill = crud.bills.get_bill(db, bill_id=bill_id)
    if db_bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")
    return db_bill

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
