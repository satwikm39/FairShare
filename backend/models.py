from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)

    # Relationships
    group_memberships = relationship("GroupMember", back_populates="user")
    item_shares = relationship("ItemShare", back_populates="user")

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

    # Relationships
    members = relationship("GroupMember", back_populates="group")
    bills = relationship("Bill", back_populates="group")

class GroupMember(Base):
    __tablename__ = "group_members"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)

    # Relationships
    user = relationship("User", back_populates="group_memberships")
    group = relationship("Group", back_populates="members")

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
    items = relationship("BillItem", back_populates="bill")

class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"))
    item_name = Column(String, index=True)
    unit_cost = Column(Float, default=0.0)

    # Relationships
    bill = relationship("Bill", back_populates="items")
    shares = relationship("ItemShare", back_populates="item")

class ItemShare(Base):
    __tablename__ = "item_shares"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("bill_items.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    share_count = Column(Integer, default=0) # Integer representing the weight

    # Relationships
    item = relationship("BillItem", back_populates="shares")
    user = relationship("User", back_populates="item_shares")
