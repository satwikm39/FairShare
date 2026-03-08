from sqlalchemy.orm import Session
from app import models, schemas

def get_group(db: Session, group_id: int):
    return db.query(models.Group).filter(models.Group.id == group_id).first()

def get_groups(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Group).offset(skip).limit(limit).all()

def create_group(db: Session, group: schemas.GroupCreate):
    db_group = models.Group(name=group.name)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

def add_user_to_group(db: Session, group_id: int, user_id: int):
    db_group_member = models.GroupMember(group_id=group_id, user_id=user_id)
    db.add(db_group_member)
    db.commit()
    return db_group_member
