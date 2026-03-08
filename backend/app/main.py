from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.main import api_router
from app.core.database import engine
from app import models

# Create the database tables
models.users.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FairShare API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change this to specific domain in production e.g. ["http://localhost:5173"]
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
