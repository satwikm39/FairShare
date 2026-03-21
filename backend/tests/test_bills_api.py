"""API tests for bills, items, shares, and table-sync."""
import pytest


class TestBillsCRUD:
    """Test basic bill CRUD via API."""

    def test_read_bill(self, client, auth_bill):
        r = client.get(f"/bills/{auth_bill.id}")
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == auth_bill.id
        assert data["group_id"] == auth_bill.group_id
        assert "items" in data

    def test_read_bill_not_found(self, client):
        r = client.get("/bills/99999")
        assert r.status_code == 404

    def test_update_bill(self, client, auth_bill):
        r = client.put(
            f"/bills/{auth_bill.id}",
            json={"total_tax": 10.0},
        )
        assert r.status_code == 200
        assert r.json()["total_tax"] == 10.0

    def test_delete_bill(self, client, auth_bill):
        bill_id = auth_bill.id
        r = client.delete(f"/bills/{bill_id}")
        assert r.status_code == 204
        r2 = client.get(f"/bills/{bill_id}")
        assert r2.status_code == 404


class TestBillItems:
    """Test bill item create, update, delete."""

    def test_create_item(self, client, auth_bill):
        r = client.post(
            f"/bills/{auth_bill.id}/items/",
            json={"item_name": "Pizza", "unit_cost": 25.0},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["item_name"] == "Pizza"
        assert data["unit_cost"] == 25.0
        assert data["bill_id"] == auth_bill.id

    def test_create_item_recalculates_totals(self, client, auth_bill):
        r = client.post(
            f"/bills/{auth_bill.id}/items/",
            json={"item_name": "Pizza", "unit_cost": 10.0},
        )
        assert r.status_code == 200
        r2 = client.get(f"/bills/{auth_bill.id}")
        assert r2.status_code == 200
        bill = r2.json()
        assert bill["subtotal"] == 10.0
        assert bill["grand_total"] == 15.0  # 10 + tax 5

    def test_update_item(self, client, auth_bill):
        cr = client.post(
            f"/bills/{auth_bill.id}/items/",
            json={"item_name": "Salad", "unit_cost": 8.0},
        )
        item_id = cr.json()["id"]
        r = client.put(
            f"/bills/items/{item_id}",
            json={"unit_cost": 12.0},
        )
        assert r.status_code == 200
        assert r.json()["unit_cost"] == 12.0

    def test_delete_item(self, client, auth_bill):
        cr = client.post(
            f"/bills/{auth_bill.id}/items/",
            json={"item_name": "Soda", "unit_cost": 3.0},
        )
        item_id = cr.json()["id"]
        r = client.delete(f"/bills/items/{item_id}")
        assert r.status_code == 204
        r2 = client.get(f"/bills/{auth_bill.id}")
        items = [i for i in r2.json()["items"] if i["id"] == item_id]
        assert len(items) == 0


class TestBillTableSync:
    """Test PUT /bills/{bill_id}/table-sync - new atomic sync endpoint."""

    def test_table_sync_new_items(self, client, auth_bill, auth_user):
        r = client.put(
            f"/bills/{auth_bill.id}/table-sync",
            json={
                "new_items": [
                    {"temp_id": -1, "item_name": "Burger", "unit_cost": 15.0},
                    {"temp_id": -2, "item_name": "Fries", "unit_cost": 5.0},
                ],
                "item_updates": [],
                "shares": [
                    {"item_id": -1, "user_id": auth_user.id, "share_count": 1},
                    {"item_id": -2, "user_id": auth_user.id, "share_count": 1},
                ],
                "total_tax": 4.0,
            },
        )
        assert r.status_code == 200
        bill = r.json()
        assert bill["subtotal"] == 20.0
        assert bill["grand_total"] == 24.0
        assert bill["total_tax"] == 4.0
        assert len(bill["items"]) == 2

    def test_table_sync_item_updates(self, client, auth_bill):
        cr = client.post(
            f"/bills/{auth_bill.id}/items/",
            json={"item_name": "Coffee", "unit_cost": 4.0},
        )
        item_id = cr.json()["id"]
        r = client.put(
            f"/bills/{auth_bill.id}/table-sync",
            json={
                "new_items": [],
                "item_updates": [
                    {"id": item_id, "unit_cost": 6.0},
                ],
                "shares": [],
                "total_tax": 5.0,
            },
        )
        assert r.status_code == 200
        assert r.json()["subtotal"] == 6.0

    def test_table_sync_invalid_temp_id_rejected(self, client, auth_bill, auth_user):
        r = client.put(
            f"/bills/{auth_bill.id}/table-sync",
            json={
                "new_items": [
                    {"temp_id": 1, "item_name": "X", "unit_cost": 1.0},
                ],
                "item_updates": [],
                "shares": [],
                "total_tax": None,
            },
        )
        assert r.status_code == 400

    def test_table_sync_bill_not_found(self, client):
        r = client.put(
            "/bills/99999/table-sync",
            json={
                "new_items": [],
                "item_updates": [],
                "shares": [],
            },
        )
        assert r.status_code == 404


class TestShares:
    """Test share add and bulk update."""

    def test_add_share_to_item(self, client, auth_bill, auth_user):
        cr = client.post(
            f"/bills/{auth_bill.id}/items/",
            json={"item_name": "Pizza", "unit_cost": 20.0},
        )
        item_id = cr.json()["id"]
        r = client.post(
            f"/bills/items/{item_id}/shares/",
            json={"user_id": auth_user.id, "share_count": 2},
        )
        assert r.status_code == 200
        assert r.json()["share_count"] == 2

    def test_shares_bulk(self, client, auth_bill, auth_user):
        cr = client.post(
            f"/bills/{auth_bill.id}/items/",
            json={"item_name": "Pizza", "unit_cost": 20.0},
        )
        item_id = cr.json()["id"]
        r = client.post(
            f"/bills/{auth_bill.id}/shares/bulk",
            json=[{"item_id": item_id, "user_id": auth_user.id, "share_count": 3}],
        )
        assert r.status_code == 200
        assert len(r.json()) == 1
        assert r.json()[0]["share_count"] == 3
