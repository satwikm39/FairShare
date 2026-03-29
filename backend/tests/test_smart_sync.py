import pytest
from app import crud, models, schemas

class TestSmartSyncScenario:
    def test_user_scenario_simplification(self, client, db, auth_user, auth_group):
        # 1. Setup users (Ansh, Satwik, Chitwandeep)
        # auth_user will be Ansh (ID=1)
        ansh = auth_user
        satwik = crud.users.create_user(db, schemas.UserCreate(name="Satwik", email="satwik@example.com"))
        chitwandeep = crud.users.create_user(db, schemas.UserCreate(name="Chitwandeep", email="chitwan@example.com"))
        db.commit()

        # Add them to the group
        crud.groups.add_user_to_group(db, auth_group.id, satwik.id)
        crud.groups.add_user_to_group(db, auth_group.id, chitwandeep.id)
        db.commit()
        
        # Enable Smart Sync
        crud.groups.update_group(db, auth_group.id, schemas.GroupUpdate(simplify_debts=True))
        db.commit()

        # 2. Create Bills
        # Bill 1: Paid by Ansh. Chitwandeep owes Ansh $5.76.
        # We'll use table-sync for convenience.
        client.put(
            f"/bills/{auth_group.id}/table-sync", # Wait, the route is /bills/{bill_id}/table-sync
            # I need to create the bill first or use the create_bill_for_group route.
        )
        
        # Let's create empty bills first
        b1 = crud.bills.create_bill(db, schemas.BillCreate(group_id=auth_group.id, name="Bill 1", paid_by_user_id=ansh.id))
        b2 = crud.bills.create_bill(db, schemas.BillCreate(group_id=auth_group.id, name="Bill 2", paid_by_user_id=satwik.id))
        b3 = crud.bills.create_bill(db, schemas.BillCreate(group_id=auth_group.id, name="Bill 3", paid_by_user_id=ansh.id))
        db.commit()

        # Bill 1: Chitwandeep owes Ansh $5.76
        client.put(f"/bills/{b1.id}/table-sync", json={
            "new_items": [{"temp_id": -1, "item_name": "Item 1", "unit_cost": 5.76}],
            "item_updates": [],
            "shares": [{"item_id": -1, "user_id": chitwandeep.id, "share_count": 1}],
            "total_tax": 0
        })

        # Bill 2: Chitwandeep owes Satwik $10.00
        client.put(f"/bills/{b2.id}/table-sync", json={
            "new_items": [{"temp_id": -1, "item_name": "Item 2", "unit_cost": 10.00}],
            "item_updates": [],
            "shares": [{"item_id": -1, "user_id": chitwandeep.id, "share_count": 1}],
            "total_tax": 0
        })

        # Bill 3: Satwik owes Ansh $10.00
        client.put(f"/bills/{b3.id}/table-sync", json={
            "new_items": [{"temp_id": -1, "item_name": "Item 3", "unit_cost": 10.00}],
            "item_updates": [],
            "shares": [{"item_id": -1, "user_id": satwik.id, "share_count": 1}],
            "total_tax": 0
        })

        # 3. Verify Balances
        r = client.get(f"/groups/{auth_group.id}/balances")
        assert r.status_code == 200
        data = r.json()
        
        # Debts should be exactly 1 transaction: Chitwandeep -> Ansh ($15.76)
        debts = data["debts"]
        assert len(debts) == 1
        debt = debts[0]
        assert debt["from_user_id"] == chitwandeep.id
        assert debt["to_user_id"] == ansh.id
        assert abs(debt["amount"] - 15.76) < 0.001

    def test_cache_recomputation_on_item_delete(self, client, db, auth_user, auth_group):
        # Setup: C owes A 10
        ansh = auth_user
        chitwandeep = crud.users.create_user(db, schemas.UserCreate(name="Chitwandeep", email="chitwan2@example.com"))
        crud.groups.add_user_to_group(db, auth_group.id, chitwandeep.id)
        db.commit()

        b1 = crud.bills.create_bill(db, schemas.BillCreate(group_id=auth_group.id, name="Bill 1", paid_by_user_id=ansh.id))
        db.commit()

        sync_res = client.put(f"/bills/{b1.id}/table-sync", json={
            "new_items": [{"temp_id": -1, "item_name": "Item 1", "unit_cost": 10.00}],
            "item_updates": [],
            "shares": [{"item_id": -1, "user_id": chitwandeep.id, "share_count": 1}],
            "total_tax": 0
        })
        item_id = sync_res.json()["items"][0]["id"]

        # Verify initial debt
        r = client.get(f"/groups/{auth_group.id}/balances")
        assert len(r.json()["debts"]) == 1
        assert r.json()["debts"][0]["amount"] == 10.00

        # Delete item (which should trigger recompute via the new route logic)
        client.delete(f"/bills/items/{item_id}")

        # Verify debt is now 0
        r2 = client.get(f"/groups/{auth_group.id}/balances")
        assert len(r2.json()["debts"]) == 0

    def test_cache_recomputation_on_item_update(self, client, db, auth_user, auth_group):
        # Setup: C owes A 10
        ansh = auth_user
        chitwandeep = crud.users.create_user(db, schemas.UserCreate(name="Chitwandeep", email="chitwan3@example.com"))
        crud.groups.add_user_to_group(db, auth_group.id, chitwandeep.id)
        db.commit()

        b1 = crud.bills.create_bill(db, schemas.BillCreate(group_id=auth_group.id, name="Bill 1", paid_by_user_id=ansh.id))
        db.commit()

        sync_res = client.put(f"/bills/{b1.id}/table-sync", json={
            "new_items": [{"temp_id": -1, "item_name": "Item 1", "unit_cost": 10.00}],
            "item_updates": [],
            "shares": [{"item_id": -1, "user_id": chitwandeep.id, "share_count": 1}],
            "total_tax": 0
        })
        item_id = sync_res.json()["items"][0]["id"]

        # Update item cost (should trigger recompute)
        client.put(f"/bills/items/{item_id}", json={"unit_cost": 25.0})

        # Verify debt updated to 25
        r = client.get(f"/groups/{auth_group.id}/balances")
        assert len(r.json()["debts"]) == 1
        assert r.json()["debts"][0]["amount"] == 25.00

    def test_cache_recomputation_on_group_update(self, client, db, auth_user, auth_group):
        # Setup: A owes B 10, B owes C 10
        user_a = auth_user # ID 1
        user_b = crud.users.create_user(db, schemas.UserCreate(name="User B", email="b@example.com"))
        user_c = crud.users.create_user(db, schemas.UserCreate(name="User C", email="c@example.com"))
        crud.groups.add_user_to_group(db, auth_group.id, user_b.id)
        crud.groups.add_user_to_group(db, auth_group.id, user_c.id)
        db.commit()

        b1 = crud.bills.create_bill(db, schemas.BillCreate(group_id=auth_group.id, name="Bill 1", paid_by_user_id=user_b.id))
        b2 = crud.bills.create_bill(db, schemas.BillCreate(group_id=auth_group.id, name="Bill 2", paid_by_user_id=user_c.id))
        db.commit()

        # A owes B 10
        client.put(f"/bills/{b1.id}/table-sync", json={
            "new_items": [{"temp_id": -1, "item_name": "Item 1", "unit_cost": 10.00}],
            "item_updates": [],
            "shares": [{"item_id": -1, "user_id": user_a.id, "share_count": 1}],
            "total_tax": 0
        })

        # B owes C 10
        client.put(f"/bills/{b2.id}/table-sync", json={
            "new_items": [{"temp_id": -1, "item_name": "Item 2", "unit_cost": 10.00}],
            "item_updates": [],
            "shares": [{"item_id": -1, "user_id": user_b.id, "share_count": 1}],
            "total_tax": 0
        })

        # Verify initial non-simplified debt (A->B, B->C)
        r = client.get(f"/groups/{auth_group.id}/balances")
        assert len(r.json()["debts"]) == 2

        # Enable Smart Sync
        client.patch(f"/groups/{auth_group.id}", json={"simplify_debts": True})

        # Verify simplified debt (A->C)
        r2 = client.get(f"/groups/{auth_group.id}/balances")
        assert len(r2.json()["debts"]) == 1
        assert r2.json()["debts"][0]["from_user_id"] == user_a.id
        assert r2.json()["debts"][0]["to_user_id"] == user_c.id

        # Disable Smart Sync
        client.patch(f"/groups/{auth_group.id}", json={"simplify_debts": False})

        # Verify reverting to non-simplified debt (A->B, B->C)
        r3 = client.get(f"/groups/{auth_group.id}/balances")
        assert len(r3.json()["debts"]) == 2
