from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid


class Token(BaseModel):
    id_token: str


class UserBase(BaseModel):
    email: EmailStr
    nickname: str | None = None


class UserResponse(UserBase):
    id: uuid.UUID
    uid: str
    email_verified: bool
    role: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
