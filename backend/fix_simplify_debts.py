import sys
import os

# Append the current directory so app modules can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from sqlalchemy import text

def main():
    db = SessionLocal()
    try:
        db.execute(text("UPDATE groups SET simplify_debts = False WHERE simplify_debts IS NULL"))
        db.commit()
        print("Successfully backfilled NULL simplify_debts rows to False.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
