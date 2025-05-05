from typing import Optional, List

from pydantic import BaseModel, Field


class GetAccountsList(BaseModel):
    page: int
    limit: int
    title: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)


class AddAccount(BaseModel):
    title: str
    data: Optional[str]
    website: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    notes: Optional[str] = None


class UpdateAccount(BaseModel):
    title: Optional[str] = None
    data: Optional[str] = None
    website: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
