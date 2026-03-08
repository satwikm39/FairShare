from pydantic import BaseModel
from typing import List, Optional

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

class BillItemBase(BaseModel):
    item_name: str
    unit_cost: float

class BillItemCreate(BillItemBase):
    pass

class BillItem(BillItemBase):
    id: int
    bill_id: int
    shares: List[ItemShare] = []

    class Config:
        from_attributes = True

class BillBase(BaseModel):
    total_tax: float = 0.0
    subtotal: float = 0.0
    grand_total: float = 0.0
    receipt_image_url: Optional[str] = None

class BillCreate(BillBase):
    group_id: int

class Bill(BillBase):
    id: int
    group_id: int
    items: List[BillItem] = []

    class Config:
        from_attributes = True
