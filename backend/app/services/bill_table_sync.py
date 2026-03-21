"""
Orchestrates persisting bill splitter table state (items, tax, shares) in one operation.
Routes stay thin; persistence rules live in crud; debt side-effects are applied here (SRP).
"""
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.services.debts import recompute_group_debts


class BillTableSyncService:
    """Applies a table sync payload and refreshes group debt cache."""

    def sync(
        self,
        db: Session,
        bill_id: int,
        payload: schemas.BillTableSyncRequest,
    ) -> models.Bill:
        db_bill = crud.bills.sync_bill_table(db, bill_id=bill_id, payload=payload)
        if db_bill is None:
            raise ValueError("Bill not found")
        recompute_group_debts(db, db_bill.group_id)
        return db_bill
