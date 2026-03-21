"""
Test fixtures. Firebase is mocked before app import so CI can run without credentials.
"""
import os
import sys
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Use in-memory SQLite for tests
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

# Mock Firebase before any app imports (avoids credential errors in CI when no Firebase creds)
_firebase_mock = MagicMock()
_firebase_mock.auth.verify_id_token = MagicMock(side_effect=Exception("Use override"))
_firebase_mock.initialize_app = MagicMock()
_firebase_mock._apps = {}
sys.modules["firebase_admin"] = _firebase_mock

from app.main import app
from app.core.database import get_db, Base
from app import models, crud, schemas
from app.api.deps import get_current_user


# Override engine for tests (in-memory)
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db():
    """Fresh DB session per test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def auth_user(db):
    """Create a user for auth context."""
    user = crud.users.create_user(db, schemas.UserCreate(name="Test User", email="test@example.com"))
    db.refresh(user)
    return user


@pytest.fixture
def auth_group(db, auth_user):
    """Create a group with auth_user as member."""
    group = crud.groups.create_group(db, schemas.GroupCreate(name="Test Group"), user_id=auth_user.id)
    db.refresh(group)
    return group


@pytest.fixture
def auth_bill(db, auth_group):
    """Create a bill in auth_group."""
    bill = crud.bills.create_bill(db, schemas.BillCreate(group_id=auth_group.id, total_tax=5.0))
    db.refresh(bill)
    return bill


@pytest.fixture
def client(db, auth_user, auth_group, auth_bill):
    """Test client with auth overrides. auth_user is member of auth_group; auth_bill belongs to auth_group."""
    def _get_db_override():
        yield db

    def _user_gen():
        yield auth_user

    app.dependency_overrides[get_db] = _get_db_override
    app.dependency_overrides[get_current_user] = _user_gen

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
