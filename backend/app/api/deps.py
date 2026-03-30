import os
import json
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app import crud, schemas, models
import firebase_admin
from firebase_admin import auth, credentials

security = HTTPBearer()

# Initialize Firebase Admin
if not firebase_admin._apps:
    try:
        service_account_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
        if service_account_json:
            # Cloud deployment: credentials stored as JSON string in env var
            service_account_info = json.loads(service_account_json)
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized from FIREBASE_SERVICE_ACCOUNT_JSON env var")
        else:
            # Local development: relies on GOOGLE_APPLICATION_CREDENTIALS file path
            firebase_admin.initialize_app()
            print("✅ Firebase initialized from GOOGLE_APPLICATION_CREDENTIALS")
    except Exception as e:
        print(f"❌ Firebase Admin initialization failed: {e}")

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        email = decoded_token.get("email")
        if not email:
            raise Exception("No email found in token")
            
        name = decoded_token.get("name", email.split('@')[0])
        
        # Check if user exists
        user = crud.users.get_user_by_email(db, email=email)
        if not user:
            # Auto-register new Firebase users into our local database
            user_create = schemas.UserCreate(name=name, email=email)
            user = crud.users.create_user(db, user_create)
            
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_active_admin(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required"
        )
    return current_user

def get_current_group_member(
    group_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> models.GroupMember:
    # Use crud to check membership
    db_group = crud.groups.get_group(db, group_id=group_id)
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    member = next((m for m in db_group.members if m.user_id == current_user.id), None)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group"
        )
    return member

def get_current_bill_access(
    bill_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> models.Bill:
    db_bill = crud.bills.get_bill(db, bill_id=bill_id)
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    # Check if user is member of the bill's group
    db_group = crud.groups.get_group(db, group_id=db_bill.group_id)
    member = next((m for m in db_group.members if m.user_id == current_user.id), None)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this bill"
        )
    return db_bill
