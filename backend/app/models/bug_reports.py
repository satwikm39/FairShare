from sqlalchemy import Column, Integer, String, Text, JSON, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class BugReport(Base):
    __tablename__ = "bug_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True) # Optional link to user
    description = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=True) # Browser, URL, etc.
    screenshot_base64 = Column(Text, nullable=True) # Base64 encoded screenshot
    status = Column(String, default="open", nullable=False) # open, closed, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
