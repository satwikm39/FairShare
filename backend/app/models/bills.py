from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    paid_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    total_tax = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    receipt_image_url = Column(String, nullable=True)

    # Relationships
    group = relationship("Group", back_populates="bills")
    payer = relationship("User", back_populates="bills_paid", foreign_keys=[paid_by_user_id])
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")
    participants = relationship("BillParticipant", back_populates="bill", cascade="all, delete-orphan")

    @property
    def participant_user_ids(self) -> list[int]:
        return [p.user_id for p in self.participants]

class BillParticipant(Base):
    __tablename__ = "bill_participants"

    bill_id = Column(Integer, ForeignKey("bills.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)

    bill = relationship("Bill", back_populates="participants")
    user = relationship("User", back_populates="bill_participations")

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
