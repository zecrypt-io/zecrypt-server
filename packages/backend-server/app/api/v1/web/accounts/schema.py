from typing import Optional, List, Any, Tuple

from pydantic import BaseModel, Field


class GetAccountsList(BaseModel):
    page: int 
    limit: int 
    name: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    sort: Optional[Tuple[str, int]] = None


class AddAccount(BaseModel):
    name: str
    data: Optional[Any] = None
    website: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)


class UpdateAccount(BaseModel):
    name: Optional[str] = None
    data: Optional[Any] = None
    website: Optional[str] = None
    tags: Optional[List[str]] = None
