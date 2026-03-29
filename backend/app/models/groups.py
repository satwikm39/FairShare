from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    currency = Column(String, default="$")
    simplify_debts = Column(Boolean, default=False)

    # Relationships
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="group", cascade="all, delete-orphan")
    debts = relationship("Debt", back_populates="group", cascade="all, delete-orphan")
    settlements = relationship("Settlement", back_populates="group", cascade="all, delete-orphan")

class GroupMember(Base):
    __tablename__ = "group_members"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)
    removed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="group_memberships")
    group = relationship("Group", back_populates="members")


class Debt(Base):
    """Cached simplified pairwise debt within a group. Recomputed on payer/share changes."""
    __tablename__ = "debts"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # owes
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)    # is owed
    amount = Column(Float, nullable=False, default=0.0)

    # Relationships
    group = relationship("Group", back_populates="debts")
    from_user = relationship("User", foreign_keys=[from_user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])
