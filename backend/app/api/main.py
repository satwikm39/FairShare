from fastapi import APIRouter
from .routes import users, groups, bills

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(groups.router, prefix="/groups", tags=["groups"])
api_router.include_router(bills.router, prefix="/bills", tags=["bills"])
