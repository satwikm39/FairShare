import requests
import time

base_url = "http://127.0.0.1:8000"

try:
    print("\n--- Testing API Endpoints ---")
    
    # 1. Health check
    r = requests.get(f"{base_url}/health")
    print(f"Health Check: {r.status_code}")
    
    import random
    unique_ext = random.randint(1000, 9999)
    # 2. Create User
    user_data = {"name": f"Bob{unique_ext}", "email": f"bob{unique_ext}@example.com"}
    r = requests.post(f"{base_url}/users/", json=user_data)
    print(f"Create User Response ({r.status_code}): {r.json()}")
    user_id = r.json().get("id")
    
    # 3. Create Group
    group_data = {"name": f"Test Group {unique_ext}"}
    r = requests.post(f"{base_url}/groups/", json=group_data)
    print(f"Create Group Response ({r.status_code}): {r.json()}")
    group_id = r.json().get("id")
    
    # 4. Add User to Group
    r = requests.post(f"{base_url}/groups/{group_id}/members/?user_id={user_id}")
    print(f"Add Member Response ({r.status_code}): {r.json()}")
    
    # 5. Create Bill
    bill_data = {"group_id": group_id, "subtotal": 50.0, "total_tax": 5.0, "grand_total": 55.0}
    r = requests.post(f"{base_url}/groups/{group_id}/bills/", json=bill_data)
    print(f"Create Bill Response ({r.status_code}): {r.json()}")
    bill_id = r.json().get("id")
    
    # 6. Add Item to Bill
    item_data = {"item_name": "Pizza", "unit_cost": 25.0}
    r = requests.post(f"{base_url}/bills/{bill_id}/items/", json=item_data)
    print(f"Add Item Response ({r.status_code}): {r.json()}")
    item_id = r.json().get("id")
    
    # 7. Add Share to Item
    share_data = {"user_id": user_id, "share_count": 2}
    # Notice the route is now /bills/items/ due to APIRouter prefix
    r = requests.post(f"{base_url}/bills/items/{item_id}/shares/", json=share_data)
    print(f"Add Share Response ({r.status_code}): {r.json()}")

except Exception as e:
    print(f"Error occurred: {e}")
