import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app import crud, schemas, models
import firebase_admin
from firebase_admin import auth

security = HTTPBearer()

# Initialize Firebase Admin
if not firebase_admin._apps:
    try:
        # Relies on GOOGLE_APPLICATION_CREDENTIALS in env, or falls back gracefully
        firebase_admin.initialize_app()
        print("✅ Firebase initialized successfully")
    except Exception as e:
        print(f"❌ Firebase Admin initialization failed: {e}. Set GOOGLE_APPLICATION_CREDENTIALS.")

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
        print(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
