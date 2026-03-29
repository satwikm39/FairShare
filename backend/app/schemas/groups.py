from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class GroupBase(BaseModel):
    name: str
    currency: str = "$"
    simplify_debts: bool = False

class GroupCreate(GroupBase):
    pass

from typing import List

class GroupMemberResponse(BaseModel):
    user_id: int
    group_id: int
    user: 'User'
    removed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Group(GroupBase):
    id: int
    members: List[GroupMemberResponse] = []

    class Config:
        from_attributes = True

from .users import User
GroupMemberResponse.model_rebuild()

class GroupMemberCreate(BaseModel):
    email: str

class GroupUpdate(BaseModel):
    name: str | None = None
    currency: str | None = None
    simplify_debts: bool | None = None
