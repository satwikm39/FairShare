from database import SessionLocal, engine, Base
import models

# Create tables
try:
    print("Creating tables...")
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    print("Inserting test data...")
    # 1. Create a user
    user1 = models.User(name="Alice", email="alice@example.com")
    db.add(user1)
    db.commit()
    db.refresh(user1)

    # 2. Create a group
    group1 = models.Group(name="Roommates")
    db.add(group1)
    db.commit()
    db.refresh(group1)

    # 3. Add user to group
    group_member = models.GroupMember(user_id=user1.id, group_id=group1.id)
    db.add(group_member)
    db.commit()

    # 4. Create a bill
    bill1 = models.Bill(group_id=group1.id, subtotal=100.0, total_tax=10.0, grand_total=110.0)
    db.add(bill1)
    db.commit()
    db.refresh(bill1)

    # 5. Create a bill item
    item1 = models.BillItem(bill_id=bill1.id, item_name="Dinner", unit_cost=50.0)
    db.add(item1)
    db.commit()
    db.refresh(item1)

    # 6. Share item
    share1 = models.ItemShare(item_id=item1.id, user_id=user1.id, share_count=1)
    db.add(share1)
    db.commit()

    print("Success: Database tables created and test data inserted properly!")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'db' in locals():
        db.close()
