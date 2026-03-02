from pydantic import BaseModel
from typing import Optional


class PolicyCreate(BaseModel):
    title: str
    category: str  # marketing, trading, custody, privacy, etc.
    content: str


class PolicyUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None  # draft, active, archived


class PolicyResponse(BaseModel):
    id: str
    title: str
    category: str
    content: str
    version: int
    status: str
    created_at: str
    updated_at: str
