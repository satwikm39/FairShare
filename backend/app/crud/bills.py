from typing import Optional

from sqlalchemy.orm import Session, joinedload
from app import models, schemas

def get_bill(db: Session, bill_id: int):
    return (
        db.query(models.Bill)
        .options(joinedload(models.Bill.participants))
        .filter(models.Bill.id == bill_id)
        .first()
    )

def get_bills_by_group(db: Session, group_id: int):
    return (
        db.query(models.Bill)
        .options(joinedload(models.Bill.participants))
        .filter(models.Bill.group_id == group_id)
        .all()
    )

def create_bill(db: Session, bill: schemas.BillCreate, group_member_ids: Optional[list[int]] = None):
    participant_ids = bill.participant_user_ids
    if participant_ids is not None:
        if len(participant_ids) == 0:
            raise ValueError("At least one participant required")
        if group_member_ids is None:
            db_group = db.query(models.Group).filter(models.Group.id == bill.group_id).first()
            if db_group:
                group_member_ids = [m.user_id for m in db_group.members]
        if group_member_ids:
            ids_set = set(group_member_ids)
            invalid = [uid for uid in participant_ids if uid not in ids_set]
            if invalid:
                raise ValueError(f"User(s) {invalid} are not group members")

    data = bill.model_dump(exclude={"participant_user_ids"})
    db_bill = models.Bill(**data)
    db.add(db_bill)
    db.flush()

    if participant_ids is not None and len(participant_ids) > 0 and group_member_ids:
        ids_set = set(group_member_ids)
        resolved = list(dict.fromkeys(participant_ids))
        resolved = [uid for uid in resolved if uid in ids_set]
        if bill.paid_by_user_id and bill.paid_by_user_id not in resolved and bill.paid_by_user_id in ids_set:
            resolved.append(bill.paid_by_user_id)
        for uid in resolved:
            db.add(models.BillParticipant(bill_id=db_bill.id, user_id=uid))

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

def sync_bill_table(
    db: Session,
    bill_id: int,
    payload: schemas.BillTableSyncRequest,
) -> Optional[models.Bill]:
    """
    Apply item creates, item patches, tax, and share upserts in one transaction.
    Client uses negative temp_id for new rows; shares may reference those ids until mapped.
    """
    db_bill = get_bill(db, bill_id)
    if db_bill is None:
        return None

    temp_id_map: dict[int, int] = {}
    seen_temp: set[int] = set()

    try:
        for ni in payload.new_items:
            if ni.temp_id >= 0:
                raise ValueError("new_items[].temp_id must be negative")
            if ni.temp_id in seen_temp:
                raise ValueError(f"Duplicate temp_id {ni.temp_id}")
            seen_temp.add(ni.temp_id)
            db_item = models.BillItem(
                item_name=ni.item_name,
                unit_cost=ni.unit_cost,
                bill_id=bill_id,
            )
            db.add(db_item)
            db.flush()
            temp_id_map[ni.temp_id] = db_item.id

        valid_item_ids = {i.id for i in db_bill.items}
        valid_item_ids.update(temp_id_map.values())

        for upd in payload.item_updates:
            if upd.id < 0:
                continue
            item = (
                db.query(models.BillItem)
                .filter(
                    models.BillItem.id == upd.id,
                    models.BillItem.bill_id == bill_id,
                )
                .first()
            )
            if item is None:
                raise ValueError(f"Bill item {upd.id} not found on this bill")
            patch = upd.model_dump(exclude_unset=True, exclude={"id"})
            for key, value in patch.items():
                setattr(item, key, value)

        if payload.total_tax is not None:
            db_bill.total_tax = payload.total_tax

        participant_ids = {p.user_id for p in db_bill.participants}
        if participant_ids:
            for share in payload.shares:
                if share.user_id not in participant_ids:
                    raise ValueError(f"User {share.user_id} is not a bill participant")

        # 4. Clean sync shares: delete existing and re-insert
        if valid_item_ids:
            db.query(models.ItemShare).filter(models.ItemShare.item_id.in_(valid_item_ids)).delete(synchronize_session=False)

        for share in payload.shares:
            item_id = share.item_id
            if item_id < 0:
                if item_id not in temp_id_map:
                    raise ValueError(f"Share references unknown temp item id {item_id}")
                item_id = temp_id_map[item_id]
            if item_id not in valid_item_ids:
                raise ValueError(f"Share references item {item_id} not on this bill")

            db_share = models.ItemShare(
                item_id=item_id,
                user_id=share.user_id,
                share_count=share.share_count,
            )
            db.add(db_share)

        items = (
            db.query(models.BillItem)
            .filter(models.BillItem.bill_id == bill_id)
            .all()
        )
        db_bill.subtotal = sum(item.unit_cost for item in items)
        db_bill.grand_total = db_bill.subtotal + db_bill.total_tax

        db.commit()
        db.refresh(db_bill)
    except Exception:
        db.rollback()
        raise

    return get_bill(db, bill_id)


def remove_user_from_bill(db: Session, bill_id: int, user_id: int) -> bool:
    """Delete all ItemShare rows and BillParticipant for this user."""
    db_bill = get_bill(db, bill_id)
    if not db_bill:
        return False
    item_ids = [item.id for item in db_bill.items]
    if item_ids:
        db.query(models.ItemShare).filter(
            models.ItemShare.item_id.in_(item_ids),
            models.ItemShare.user_id == user_id,
        ).delete(synchronize_session=False)
    db.query(models.BillParticipant).filter(
        models.BillParticipant.bill_id == bill_id,
        models.BillParticipant.user_id == user_id,
    ).delete(synchronize_session=False)
    db.commit()
    return True


def add_participant_to_bill(db: Session, bill_id: int, user_id: int, group_member_ids: list[int]) -> bool:
    """Add user as bill participant. User must be a group member."""
    if user_id not in group_member_ids:
        raise ValueError("User is not a group member")
    existing = (
        db.query(models.BillParticipant)
        .filter(models.BillParticipant.bill_id == bill_id, models.BillParticipant.user_id == user_id)
        .first()
    )
    if existing:
        return True
    db.add(models.BillParticipant(bill_id=bill_id, user_id=user_id))
    db.commit()
    return True
