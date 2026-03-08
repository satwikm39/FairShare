import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

load_dotenv()

# We will use sqlite for local dev unless a Postgres URL is provided
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

connect_args = {"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}

# For postgres using an external connection pooler (like Supabase Transaction pool),
# disable SQLAlchemy's internal pool to prevent conflicts.
# Sqlite doesn't strictly need NullPool, but it works fine with it for local dev.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args,
    poolclass=NullPool
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
