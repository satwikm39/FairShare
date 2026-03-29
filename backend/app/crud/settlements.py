from sqlalchemy.orm import Session
from app import models, schemas

def create_settlement(db: Session, settlement: schemas.SettlementCreate):
    db_settlement = models.Settlement(
        group_id=settlement.group_id,
        from_user_id=settlement.from_user_id,
        to_user_id=settlement.to_user_id,
        amount=settlement.amount
    )
    db.add(db_settlement)
    db.commit()
    db.refresh(db_settlement)
    return db_settlement

def get_settlements_by_group(db: Session, group_id: int):
    return db.query(models.Settlement).filter(models.Settlement.group_id == group_id).all()

def update_settlement(db: Session, settlement_id: int, settlement_update: schemas.SettlementUpdate):
    db_settlement = db.query(models.Settlement).filter(models.Settlement.id == settlement_id).first()
    if not db_settlement:
        return None
        
    update_data = settlement_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_settlement, key, value)
        
    db.commit()
    db.refresh(db_settlement)
    return db_settlement

def delete_settlement(db: Session, settlement_id: int):
    db_settlement = db.query(models.Settlement).filter(models.Settlement.id == settlement_id).first()
    if not db_settlement:
        return False
        
    db.delete(db_settlement)
    db.commit()
    return True
