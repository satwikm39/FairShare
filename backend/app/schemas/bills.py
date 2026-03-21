from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ItemShareBase(BaseModel):
    user_id: int
    share_count: int

class ItemShareCreate(ItemShareBase):
    pass

class ItemShare(ItemShareBase):
    id: int
    item_id: int

    class Config:
        from_attributes = True

class ItemShareUpdateBulk(BaseModel):
    item_id: int
    user_id: int
    share_count: int

class BillItemBase(BaseModel):
    item_name: str
    unit_cost: float

class BillItemCreate(BillItemBase):
    pass

class BillItemUpdate(BaseModel):
    item_name: Optional[str] = None
    unit_cost: Optional[float] = None


class BillItemBulkUpdate(BaseModel):
    """Patch fields for an existing persisted line item (positive id)."""
    id: int
    item_name: Optional[str] = None
    unit_cost: Optional[float] = None


class NewBillItemSync(BaseModel):
    """
    A line item that only exists on the client until sync.
    temp_id must be negative and unique within the request; shares may reference this id.
    """
    temp_id: int
    item_name: str
    unit_cost: float


class BillTableSyncRequest(BaseModel):
    """Atomic save of splitter table state (last-write-wins)."""
    shares: List[ItemShareUpdateBulk] = []
    item_updates: List[BillItemBulkUpdate] = []
    total_tax: Optional[float] = None
    new_items: List[NewBillItemSync] = []

class BillItem(BillItemBase):
    id: int
    bill_id: int
    shares: List[ItemShare] = []

    class Config:
        from_attributes = True

class BillBase(BaseModel):
    name: Optional[str] = None
    date: Optional[datetime] = None
    total_tax: float = 0.0
    subtotal: float = 0.0
    grand_total: float = 0.0
    receipt_image_url: Optional[str] = None
    paid_by_user_id: Optional[int] = None

class BillUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[datetime] = None
    total_tax: Optional[float] = None
    paid_by_user_id: Optional[int] = None

class BillCreate(BillBase):
    group_id: int
    participant_user_ids: Optional[List[int]] = None

class Bill(BillBase):
    id: int
    group_id: int
    items: List[BillItem] = []
    participant_user_ids: List[int] = []

    class Config:
        from_attributes = True


# Balance-related schemas
class UserBalance(BaseModel):
    user_id: int
    user_name: str
    net_amount: float  # positive = is owed, negative = owes

class DebtDetail(BaseModel):
    from_user_id: int
    from_user_name: str
    to_user_id: int
    to_user_name: str
    amount: float

class GroupBalances(BaseModel):
    balances: List[UserBalance]
    debts: List[DebtDetail]  # simplified "A owes B $X" statements
    my_net_amount: float  # current user's net
