from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class SettlementBase(BaseModel):
    group_id: int
    from_user_id: int
    to_user_id: int
    amount: float

class SettlementCreate(SettlementBase):
    pass

class Settlement(SettlementBase):
    id: int
    date: datetime
    
    model_config = ConfigDict(from_attributes=True)
