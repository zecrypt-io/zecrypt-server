from typing import Optional, List, Any

from pydantic import BaseModel, Field


class AddAccount(BaseModel):
    name: str
    data: Optional[Any] = None
    user_name: str
    password: str
    website: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)


class UpdateAccount(BaseModel):
    name: Optional[str] = None
    data: Optional[Any] = None
    user_name: Optional[str] = None
    password: Optional[str] = None
    website: Optional[str] = None
    tags: Optional[List[str]] = None
