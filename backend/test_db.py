import json
from app.core.database import SessionLocal
from app.models.bills import Bill

db = SessionLocal()
bills = db.query(Bill).all()

res = []
for b in bills:
    res.append({
        "id": b.id,
        "name": b.name,
        "date": str(b.date),
        "total_tax": b.total_tax,
        "subtotal": b.subtotal,
        "grand_total": b.grand_total,
        "items": [{"name": i.item_name, "cost": i.unit_cost} for i in b.items]
    })

print(json.dumps(res, indent=2))
db.close()
