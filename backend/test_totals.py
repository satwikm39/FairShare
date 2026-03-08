import json
from app.core.database import SessionLocal
from app.crud.bills import recalculate_bill_totals
from app.models.bills import Bill

db = SessionLocal()
b = recalculate_bill_totals(db, 1)

print({
    "id": b.id,
    "subtotal": b.subtotal,
    "grand_total": b.grand_total,
})
db.close()
