from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    is_admin = Column(Integer, default=0, server_default="0", nullable=False) # 0 = False, 1 = True
    textract_usage_count = Column(Integer, default=0)

    # Relationships
    group_memberships = relationship("GroupMember", back_populates="user")
    item_shares = relationship("ItemShare", back_populates="user")
    bills_paid = relationship("Bill", back_populates="payer", foreign_keys="Bill.paid_by_user_id")
