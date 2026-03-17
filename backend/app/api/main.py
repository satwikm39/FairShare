from fastapi import APIRouter, Depends
from .routes import users, groups, bills

from .deps import get_current_user

api_router = APIRouter(dependencies=[Depends(get_current_user)])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(groups.router, prefix="/groups", tags=["groups"])
api_router.include_router(bills.router, prefix="/bills", tags=["bills"])
