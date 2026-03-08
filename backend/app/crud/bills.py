from sqlalchemy.orm import Session
from app import models, schemas

def get_bill(db: Session, bill_id: int):
    return db.query(models.Bill).filter(models.Bill.id == bill_id).first()

def get_bills_by_group(db: Session, group_id: int):
    return db.query(models.Bill).filter(models.Bill.group_id == group_id).all()

def create_bill(db: Session, bill: schemas.BillCreate):
    db_bill = models.Bill(**bill.model_dump())
    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)
    return db_bill

def update_bill(db: Session, bill_id: int, **kwargs):
    db_bill = get_bill(db, bill_id)
    if db_bill:
        for key, value in kwargs.items():
            setattr(db_bill, key, value)
        db.commit()
        db.refresh(db_bill)
    return db_bill

def create_bill_item(db: Session, bill_id: int, item: schemas.BillItemCreate):
    db_item = models.BillItem(**item.model_dump(), bill_id=bill_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def add_item_share(db: Session, item_id: int, share: schemas.ItemShareCreate):
    existing_share = db.query(models.ItemShare).filter(
        models.ItemShare.item_id == item_id,
        models.ItemShare.user_id == share.user_id
    ).first()
    
    if existing_share:
        existing_share.share_count = share.share_count
        db.commit()
        db.refresh(existing_share)
        return existing_share
        
    db_share = models.ItemShare(**share.model_dump(), item_id=item_id)
    db.add(db_share)
    db.commit()
    db.refresh(db_share)
    return db_share
