import os
import sys
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from app import crud, models

def test_get_groups():
    db = SessionLocal()
    try:
        # Check all group members
        members = db.query(models.GroupMember).all()
        print(f"DEBUG: Total GroupMember records: {len(members)}")
        for m in members:
            print(f"  User {m.user_id}, Group {m.group_id}, removed_at: {m.removed_at}")
            
        # Check groups for all users
        user_ids = set(m.user_id for m in members)
        for uid in user_ids:
            groups = crud.groups.get_groups_for_user(db, user_id=uid)
            print(f"DEBUG: User {uid} has {len(groups)} groups")
            for g in groups:
                print(f"    Group {g.id}: {g.name}")

        # Simulate a removal to test if it still shows up
        if user_ids:
            uid = list(user_ids)[0]
            m = db.query(models.GroupMember).filter_by(user_id=uid).first()
            if m:
                gid = m.group_id
                print(f"\nDEBUG: Simulating removal for User {uid} in Group {gid}...")
                m.removed_at = datetime.now()
                db.commit()
                
                groups_after = crud.groups.get_groups_for_user(db, user_id=uid)
                print(f"DEBUG: User {uid} now has {len(groups_after)} groups")
                for g in groups_after:
                    is_removed = any(mem.user_id == uid and mem.removed_at for mem in g.members)
                    print(f"    Group {g.id}: {g.name} (Removed: {is_removed})")
                
                # Revert for safety
                m.removed_at = None
                db.commit()
                
    finally:
        db.close()

if __name__ == "__main__":
    test_get_groups()
