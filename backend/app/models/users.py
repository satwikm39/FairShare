from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)

    # Relationships
    group_memberships = relationship("GroupMember", back_populates="user")
    item_shares = relationship("ItemShare", back_populates="user")
