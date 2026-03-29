from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, crud, models
from app.api.deps import get_current_user, get_db, get_current_group_member
from app.services.email import send_invite_email
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
    member: models.GroupMember = Depends(get_current_group_member)
):
    db_group = crud.groups.get_group(db, group_id=group_id)
    # The dependency already checked existence and membership
    return db_group

@router.patch("/{group_id}", response_model=schemas.Group)
def update_group(
    group_id: int,
    group_update: schemas.GroupUpdate,
    db: Session = Depends(get_db),
    member: models.GroupMember = Depends(get_current_group_member)
):
    if member.removed_at:
        raise HTTPException(status_code=403, detail="Historical members cannot update group settings")
    updated_group = crud.groups.update_group(db=db, group_id=group_id, group_update=group_update)
    return updated_group

@router.delete("/{group_id}", status_code=204)
def delete_group(
    group_id: int, 
    db: Session = Depends(get_db),
    member: models.GroupMember = Depends(get_current_group_member)
):
    if member.removed_at:
        raise HTTPException(status_code=403, detail="Historical members cannot delete groups")
    db_group = crud.groups.delete_group(db=db, group_id=group_id)
    return None

@router.post("/{group_id}/members/")
def add_group_member(
    group_id: int, 
    member_data: schemas.GroupMemberCreate, 
    db: Session = Depends(get_db),
    member: models.GroupMember = Depends(get_current_group_member)
):
    if member.removed_at:
        raise HTTPException(status_code=403, detail="Historical members cannot add new members")
    db_group = crud.groups.get_group(db, group_id=group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
        
    db_user = crud.users.get_user_by_email(db, email=member.email)
    if db_user is None:
        # Create a placeholder user for invitations
        db_user = models.User(email=member.email, name=None)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        print(f"DEBUG: Created placeholder user for email {member.email}")
        
    # Check if already a member (could add to CRUD)
    # For now, just add them
    try:
        new_membership = crud.groups.add_user_to_group(db=db, group_id=group_id, user_id=db_user.id)
        
        # Trigger invitation email
        try:
            send_invite_email(
                to_email=member_data.email, 
                group_name=db_group.name, 
                invited_by_name=member.user.name
            )
        except Exception as email_err:
            print(f"WARNING: Email invitation failed but user was added: {email_err}")
            
        return new_membership
    except Exception as e:
        # Catch potential UniqueViolation if already in group
        raise HTTPException(status_code=400, detail="User is already a member of this group")

@router.delete("/{group_id}/members/{user_id}", status_code=204)
def remove_group_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_group = crud.groups.get_group(db, group_id=group_id)
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")

    user_is_member = any(m.user_id == current_user.id for m in db_group.members)
    if not user_is_member:
        raise HTTPException(status_code=403, detail="Not authorized")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself from the group")

    # Force recompute to ensure we are checking against the latest balances
    from app.services.debts import recompute_group_debts
    recompute_group_debts(db, group_id)

    # Block removal if the user has unsettled debts in this group
    outstanding = db.query(models.Debt).filter(
        models.Debt.group_id == group_id,
        (models.Debt.from_user_id == user_id) | (models.Debt.to_user_id == user_id)
    ).first()
    if outstanding:
        raise HTTPException(
            status_code=400,
            detail="This member has unsettled debts in the group. Settle all balances before removing them."
        )

    removed = crud.groups.remove_user_from_group(db=db, group_id=group_id, user_id=user_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Member not found in group")

    # Invalidate debt cache — the removed user's debts are no longer valid
    from app.services.debts import recompute_group_debts
    recompute_group_debts(db, group_id)
    return None

@router.get("/{group_id}/bills/", response_model=List[schemas.Bill])
def read_group_bills(
    group_id: int, 
    db: Session = Depends(get_db),
    member: models.GroupMember = Depends(get_current_group_member)
):
    bills = crud.bills.get_bills_by_group(db=db, group_id=group_id)
    if member.removed_at:
        bills = [b for b in bills if b.date <= member.removed_at]
    return bills


@router.get("/{group_id}/balances", response_model=schemas.GroupBalances)
def get_group_balances(
    group_id: int,
    db: Session = Depends(get_db),
    member: models.GroupMember = Depends(get_current_group_member),
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
        my_net_amount=user_net.get(member.user_id, 0.0)
    )

@router.post("/{group_id}/bills/", response_model=schemas.Bill)
def create_bill_for_group(
    group_id: int, 
    bill: schemas.BillCreate, 
    db: Session = Depends(get_db),
    member: models.GroupMember = Depends(get_current_group_member)
):
    if member.removed_at:
        raise HTTPException(status_code=403, detail="Historical members cannot create new bills")
    bill.group_id = group_id
    db_group = crud.groups.get_group(db, group_id=group_id)
    group_member_ids = [m.user_id for m in db_group.members] if db_group else []
    try:
        return crud.bills.create_bill(db=db, bill=bill, group_member_ids=group_member_ids)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{group_id}/settlements", response_model=schemas.Settlement)
def create_settlement(
    group_id: int,
    settlement: schemas.SettlementCreate,
    db: Session = Depends(get_db),
    member: models.GroupMember = Depends(get_current_group_member)
):
    if member.removed_at:
        raise HTTPException(status_code=403, detail="Historical members cannot record payments")
    if settlement.group_id != group_id:
        raise HTTPException(status_code=400, detail="Path group_id must match body group_id")
    
    # Must be recording a payment involving themselves
    if member.user_id not in [settlement.from_user_id, settlement.to_user_id]:
        raise HTTPException(status_code=403, detail="You can only record settlements you are involved in")
        
    created = crud.settlements.create_settlement(db=db, settlement=settlement)
    
    # Invalidate and recompute debt cache
    from app.services.debts import recompute_group_debts
    recompute_group_debts(db, group_id)
    
    return created

@router.get("/{group_id}/settlements", response_model=List[schemas.Settlement])
def read_group_settlements(
    group_id: int,
    db: Session = Depends(get_db),
    member: models.GroupMember = Depends(get_current_group_member)
):
    """Fetch all recorded payments for a group."""
    settlements = crud.settlements.get_settlements_by_group(db, group_id=group_id)
    if member.removed_at:
        settlements = [s for s in settlements if s.date <= member.removed_at]
    return settlements

@router.patch("/{group_id}/settlements/{settlement_id}", response_model=schemas.Settlement)
def update_group_settlement(
    group_id: int,
    settlement_id: int,
    settlement_update: schemas.SettlementUpdate,
    db: Session = Depends(get_db),
    member: models.GroupMember = Depends(get_current_group_member)
):
    if member.removed_at:
        raise HTTPException(status_code=403, detail="Historical members cannot update payments")
    """Update a recorded payment."""
    db_settlement = crud.settlements.update_settlement(
        db, settlement_id=settlement_id, settlement_update=settlement_update
    )
    if not db_settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
        
    if db_settlement.group_id != group_id:
        raise HTTPException(status_code=400, detail="Settlement does not belong to this group")
        
    # Recompute debts
    from app.services.debts import recompute_group_debts
    recompute_group_debts(db, group_id)
    
    return db_settlement

@router.delete("/{group_id}/settlements/{settlement_id}", status_code=204)
def delete_group_settlement(
    group_id: int,
    settlement_id: int,
    db: Session = Depends(get_db),
    member: models.GroupMember = Depends(get_current_group_member)
):
    if member.removed_at:
        raise HTTPException(status_code=403, detail="Historical members cannot delete payments")
    """Delete a recorded payment."""
    # Check existence and group ownership first
    db_settlement = db.query(models.Settlement).filter(models.Settlement.id == settlement_id).first()
    if not db_settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    if db_settlement.group_id != group_id:
        raise HTTPException(status_code=400, detail="Settlement does not belong to this group")
        
    success = crud.settlements.delete_settlement(db, settlement_id=settlement_id)
    if not success:
        raise HTTPException(status_code=404, detail="Settlement not found")
        
    # Recompute debts
    from app.services.debts import recompute_group_debts
    recompute_group_debts(db, group_id)
    
    return None
