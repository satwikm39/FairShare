from pydantic import BaseModel

class UserBase(BaseModel):
    name: str
    email: str
    textract_usage_count: int = 0

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: str | None = None

class User(UserBase):
    id: int

    class Config:
        from_attributes = True
