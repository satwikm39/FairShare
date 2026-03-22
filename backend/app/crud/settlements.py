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
