import os
import sys

# Add backend directory to sys.path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.crud import bills as crud_bills
from app.schemas import bills as schemas_bills
from app import models

def run_test():
    db = SessionLocal()
    try:
        print("1. Creating a dummy group for testing")
        group = models.Group(name="Test Group for Recalculation")
        db.add(group)
        db.commit()
        db.refresh(group)
        print(f"   Created group ID: {group.id}")
        
        print("2. Creating a dummy bill")
        bill_create = schemas_bills.BillCreate(group_id=group.id, total_tax=5.0) # Assume tax has been updated
        bill = crud_bills.create_bill(db, bill_create)
        print(f"   Created bill ID: {bill.id} with tax: {bill.total_tax}")
        
        print("3. Adding Item 1 at cost $10.0")
        item1_create = schemas_bills.BillItemCreate(item_name="Item 1", unit_cost=10.0)
        item1 = crud_bills.create_bill_item(db, bill.id, item1_create)
        
        db.refresh(bill)
        print(f"   Bill Totals After Item 1: Subtotal=${bill.subtotal}, Grand Total=${bill.grand_total}")
        # Expected: Subtotal=10.0, Grand Total=15.0
        assert bill.subtotal == 10.0, f"Expected 10.0 subtotal, got {bill.subtotal}"
        assert bill.grand_total == 15.0, f"Expected 15.0 grand_total, got {bill.grand_total}"

        print("4. Adding Item 2 at cost $25.5")
        item2_create = schemas_bills.BillItemCreate(item_name="Item 2", unit_cost=25.5)
        item2 = crud_bills.create_bill_item(db, bill.id, item2_create)
        
        db.refresh(bill)
        print(f"   Bill Totals After Item 2: Subtotal=${bill.subtotal}, Grand Total=${bill.grand_total}")
        # Expected: Subtotal=35.5, Grand Total=40.5
        assert bill.subtotal == 35.5, f"Expected 35.5 subtotal, got {bill.subtotal}"
        assert bill.grand_total == 40.5, f"Expected 40.5 grand_total, got {bill.grand_total}"

        print("5. Updating Item 1 cost to $15.0")
        item1_update = schemas_bills.BillItemUpdate(unit_cost=15.0)
        crud_bills.update_bill_item(db, item1.id, item1_update)
        
        db.refresh(bill)
        print(f"   Bill Totals After Update: Subtotal=${bill.subtotal}, Grand Total=${bill.grand_total}")
        # Expected: Subtotal=40.5, Grand Total=45.5
        assert bill.subtotal == 40.5, f"Expected 40.5 subtotal, got {bill.subtotal}"
        assert bill.grand_total == 45.5, f"Expected 45.5 grand_total, got {bill.grand_total}"
        
        print("6. Test passed successfully. Cleaning up.")
        db.delete(bill)
        db.delete(group)
        db.commit()

    except Exception as e:
        print(f"Test failed with error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
