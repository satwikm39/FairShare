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
        
        # If total_tax or anything else was modified, we should ensure the totals reflect it
        recalculate_bill_totals(db, bill_id)
        db.refresh(db_bill) # Refresh again to ensure the API returns the updated grand_total
        
    return db_bill

def recalculate_bill_totals(db: Session, bill_id: int):
    db_bill = get_bill(db, bill_id)
    if not db_bill:
        return None
        
    items = db.query(models.BillItem).filter(models.BillItem.bill_id == bill_id).all()
    subtotal = sum(item.unit_cost for item in items)
    
    db_bill.subtotal = subtotal
    
    # Grand total is strictly the item subtotal plus whatever the parser or user explicitly mapped as tax
    db_bill.grand_total = subtotal + db_bill.total_tax
    
    db.commit()
    db.refresh(db_bill)
    return db_bill

def create_bill_item(db: Session, bill_id: int, item: schemas.BillItemCreate):
    db_item = models.BillItem(**item.model_dump(), bill_id=bill_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Recalculate totals
    recalculate_bill_totals(db, bill_id)
    
    return db_item

def update_bill_item(db: Session, item_id: int, item_update: schemas.BillItemUpdate):
    db_item = db.query(models.BillItem).filter(models.BillItem.id == item_id).first()
    if db_item:
        update_data = item_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
        
        # Recalculate totals
        recalculate_bill_totals(db, db_item.bill_id)
        
    return db_item

def delete_bill_item(db: Session, item_id: int):
    db_item = db.query(models.BillItem).filter(models.BillItem.id == item_id).first()
    if db_item:
        bill_id = db_item.bill_id
        db.delete(db_item)
        db.commit()
        
        # Recalculate totals
        recalculate_bill_totals(db, bill_id)
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

def add_item_shares_bulk(db: Session, bill_id: int, shares: list[schemas.ItemShareUpdateBulk]):
    # In a production app, we would verify all item_ids belong to the bill_id
    # But for MVP we'll just upsert them all in one transaction
    updated_shares = []
    
    for share in shares:
        existing_share = db.query(models.ItemShare).filter(
            models.ItemShare.item_id == share.item_id,
            models.ItemShare.user_id == share.user_id
        ).first()
        
        if existing_share:
            existing_share.share_count = share.share_count
            updated_shares.append(existing_share)
        else:
            db_share = models.ItemShare(
                item_id=share.item_id,
                user_id=share.user_id,
                share_count=share.share_count
            )
            db.add(db_share)
            updated_shares.append(db_share)
            
    db.commit()
    
    # We do a refresh just to ensure they load properly if returned
    for s in updated_shares:
        db.refresh(s)
        
    return updated_shares

def delete_bill(db: Session, bill_id: int):
    db_bill = get_bill(db, bill_id)
    if db_bill:
        db.delete(db_bill)
        db.commit()
    return db_bill

def remove_user_from_bill(db: Session, bill_id: int, user_id: int) -> bool:
    """Delete all ItemShare rows for this user across every item in the bill."""
    db_bill = get_bill(db, bill_id)
    if not db_bill:
        return False
    item_ids = [item.id for item in db_bill.items]
    if not item_ids:
        return True
    deleted = db.query(models.ItemShare).filter(
        models.ItemShare.item_id.in_(item_ids),
        models.ItemShare.user_id == user_id
    ).delete(synchronize_session=False)
    db.commit()
    return True
