from sqlalchemy.orm import Session, joinedload
from app import models, schemas

def get_group(db: Session, group_id: int):
    return db.query(models.Group).options(
        joinedload(models.Group.members).joinedload(models.GroupMember.user)
    ).filter(models.Group.id == group_id).first()

def get_groups(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Group).offset(skip).limit(limit).all()

def get_groups_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Group)
        .join(models.GroupMember)
        .filter(models.GroupMember.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_group(db: Session, group: schemas.GroupCreate, user_id: int):
    db_group = models.Group(name=group.name)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    # Add creator as a member
    db_group_member = models.GroupMember(group_id=db_group.id, user_id=user_id)
    db.add(db_group_member)
    db.commit()
    db.refresh(db_group)
    
    return db_group

def add_user_to_group(db: Session, group_id: int, user_id: int):
    db_group_member = models.GroupMember(group_id=group_id, user_id=user_id)
    db.add(db_group_member)
    db.commit()
    return db_group_member

def delete_group(db: Session, group_id: int):
    db_group = get_group(db, group_id)
    if db_group:
        db.delete(db_group)
        db.commit()
    return db_group
