from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    total_tax = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    receipt_image_url = Column(String, nullable=True)

    # Relationships
    group = relationship("Group", back_populates="bills")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")

class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"))
    item_name = Column(String, index=True)
    unit_cost = Column(Float, default=0.0)

    # Relationships
    bill = relationship("Bill", back_populates="items")
    shares = relationship("ItemShare", back_populates="item", cascade="all, delete-orphan")

class ItemShare(Base):
    __tablename__ = "item_shares"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("bill_items.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    share_count = Column(Integer, default=0) # Integer representing the weight

    # Relationships
    item = relationship("BillItem", back_populates="shares")
    user = relationship("User", back_populates="item_shares")
