from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, crud
from app.core.database import get_db
from typing import List

router = APIRouter()

@router.post("/", response_model=schemas.Group)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db)):
    return crud.groups.create_group(db=db, group=group)

@router.get("/", response_model=List[schemas.Group])
def read_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    groups = crud.groups.get_groups(db, skip=skip, limit=limit)
    return groups

@router.get("/{group_id}", response_model=schemas.Group)
def read_group(group_id: int, db: Session = Depends(get_db)):
    db_group = crud.groups.get_group(db, group_id=group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return db_group

@router.post("/{group_id}/members/")
def add_group_member(group_id: int, user_id: int, db: Session = Depends(get_db)):
    db_group = crud.groups.get_group(db, group_id=group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    db_user = crud.users.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.groups.add_user_to_group(db=db, group_id=group_id, user_id=user_id)

@router.get("/{group_id}/bills/", response_model=List[schemas.Bill])
def read_group_bills(group_id: int, db: Session = Depends(get_db)):
    db_group = crud.groups.get_group(db, group_id=group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return crud.bills.get_bills_by_group(db=db, group_id=group_id)

@router.post("/{group_id}/bills/", response_model=schemas.Bill)
def create_bill_for_group(group_id: int, bill: schemas.BillCreate, db: Session = Depends(get_db)):
    db_group = crud.groups.get_group(db, group_id=group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    # Ensure bill create object has group ID
    bill.group_id = group_id
    return crud.bills.create_bill(db=db, bill=bill)
