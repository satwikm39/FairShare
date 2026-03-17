from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, crud, models
from app.api.deps import get_current_user, get_db, get_current_group_member
from typing import List

router = APIRouter()

@router.post("/", response_model=schemas.Group)
def create_group(
    group: schemas.GroupCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_group = crud.groups.create_group(db=db, group=group, user_id=current_user.id)
    # Refresh to get the eager loaded members
    return crud.groups.get_group(db=db, group_id=db_group.id)

@router.get("/", response_model=List[schemas.Group])
def read_groups(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    groups = crud.groups.get_groups_for_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return groups

@router.get("/{group_id}", response_model=schemas.Group)
def read_group(
    group_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_group_member)
):
    db_group = crud.groups.get_group(db, group_id=group_id)
    # The dependency already checked existence and membership
    return db_group

@router.patch("/{group_id}", response_model=schemas.Group)
def update_group(
    group_id: int,
    group_update: schemas.GroupUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_group_member)
):
    updated_group = crud.groups.update_group(db=db, group_id=group_id, group_update=group_update)
    return updated_group

@router.delete("/{group_id}", status_code=204)
def delete_group(
    group_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_group_member)
):
    db_group = crud.groups.delete_group(db=db, group_id=group_id)
    return None

@router.post("/{group_id}/members/")
def add_group_member(
    group_id: int, 
    member: schemas.GroupMemberCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_group_member)
):
    db_group = crud.groups.get_group(db, group_id=group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
        
    db_user = crud.users.get_user_by_email(db, email=member.email)
    if db_user is None:
        raise HTTPException(status_code=404, detail=f"User with email {member.email} not found")
        
    # Check if already a member (could add to CRUD)
    # For now, just add them
    try:
        return crud.groups.add_user_to_group(db=db, group_id=group_id, user_id=db_user.id)
    except Exception as e:
        # Catch potential UniqueViolation if already in group
        raise HTTPException(status_code=400, detail="User is already a member of this group")

@router.get("/{group_id}/bills/", response_model=List[schemas.Bill])
def read_group_bills(
    group_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_group_member)
):
    return crud.bills.get_bills_by_group(db=db, group_id=group_id)


@router.get("/{group_id}/balances", response_model=schemas.GroupBalances)
def get_group_balances(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_group_member),
    refresh: bool = False,
):
    """Serve cached pairwise debts for a group. Set ?refresh=true to force recompute."""
    from app.services.debts import recompute_group_debts

    db_group = crud.groups.get_group(db, group_id=group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")

    # Recompute if explicitly requested or no data cached yet
    cached_debts = db.query(models.Debt).filter(models.Debt.group_id == group_id).all()
    if refresh or (not cached_debts and any(b.paid_by_user_id is not None for b in db_group.bills)):
        recompute_group_debts(db, group_id)
        cached_debts = db.query(models.Debt).filter(models.Debt.group_id == group_id).all()

    user_map: dict[int, str] = {m.user.id: m.user.name for m in db_group.members}

    # Build response schemas from cached debts
    simplified_debts = [
        schemas.DebtDetail(
            from_user_id=d.from_user_id,
            from_user_name=d.from_user.name,
            to_user_id=d.to_user_id,
            to_user_name=d.to_user.name,
            amount=d.amount
        )
        for d in cached_debts
    ]

    user_net: dict[int, float] = {}
    for uid in user_map:
        owed = sum(d.amount for d in cached_debts if d.to_user_id == uid)
        owes = sum(d.amount for d in cached_debts if d.from_user_id == uid)
        user_net[uid] = round(owed - owes, 2)

    balances = [
        schemas.UserBalance(user_id=uid, user_name=name, net_amount=user_net.get(uid, 0.0))
        for uid, name in user_map.items()
    ]

    return schemas.GroupBalances(
        balances=balances,
        debts=simplified_debts,
        my_net_amount=user_net.get(current_user.id, 0.0)
    )

@router.post("/{group_id}/bills/", response_model=schemas.Bill)
def create_bill_for_group(
    group_id: int, 
    bill: schemas.BillCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_group_member)
):
    # Ensure bill create object has group ID
    bill.group_id = group_id
    return crud.bills.create_bill(db=db, bill=bill)
