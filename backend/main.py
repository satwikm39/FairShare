from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Bill Splitter API")

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
    return {"message": "Welcome to the Smart Bill Splitter API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
