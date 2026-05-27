from app.database import SessionLocal
from app.models.query_model import QueryHistory, SavedQuery
from app.models.user_model import User

db = SessionLocal()
try:
    users = db.query(User).all()
    print(f"\n=========================================")
    print(f"NovaSQL Total Registered Accounts: {len(users)}")
    print(f"=========================================")
    for idx, u in enumerate(users, start=1):
        print(f"{idx}. ID: {u.id}")
        print(f"   Username: {u.username}")
        print(f"   Email:    {u.email}")
        print(f"   Password (Hashed): {u.password}")
        print(f"   Created:  {u.created_at}")
        print(f"-----------------------------------------")
    print(f"=========================================\n")
except Exception as e:
    print("Error querying users table:", e)
finally:
    db.close()
