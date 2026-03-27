from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime

class BugReportBase(BaseModel):
    description: str
    metadata_json: Optional[dict[str, Any]] = None
    screenshot_base64: Optional[str] = None
    status: str = "open"

class BugReportUpdate(BaseModel):
    description: Optional[str] = None
    metadata_json: Optional[dict[str, Any]] = None
    screenshot_base64: Optional[str] = None
    status: Optional[str] = None

class BugReportCreate(BugReportBase):
    user_id: Optional[int] = None

class BugReport(BugReportBase):
    id: int
    user_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
