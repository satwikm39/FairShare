from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.main import api_router
from app.core.database import engine
from app import models

# Create the database tables
try:
    models.users.Base.metadata.create_all(bind=engine)
    print("✅ Database initialized successfully")
except Exception as e:
    print(f"❌ Database initialization failed: {e}")
app = FastAPI(title="FairShare API")

# Configure CORS for frontend
import os
origins = [
    origin.strip().rstrip('/') 
    for origin in os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:5173,http://localhost:3000"
    ).split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the FairShare API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Include the API routers
app.include_router(api_router)
