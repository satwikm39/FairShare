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

class BillUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[datetime] = None
    total_tax: Optional[float] = None

class BillCreate(BillBase):
    group_id: int

class Bill(BillBase):
    id: int
    group_id: int
    items: List[BillItem] = []

    class Config:
        from_attributes = True
