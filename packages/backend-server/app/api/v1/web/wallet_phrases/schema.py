from app.framework.mongo_db.base_model import BaseModel
from typing import Optional, Any, List, Literal
from pydantic import Field


class WalletPhrase(BaseModel):
    title: str
    wallet_type: Optional[str] = None
    tags: Optional[list[str]] = None
    data: Optional[Any] = None
    notes: Optional[str] = None


class UpdateWalletPhrase(BaseModel):
    title: Optional[str] = None
    wallet_type: Optional[str] = None
    tags: Optional[list[str]] = None
    data: Optional[Any] = None
    notes: Optional[str] = None


class GetWalletPhrasesList(BaseModel):
    page: int
    limit: int
    tags: Optional[List[str]] = Field(default_factory=list)
    title: Optional[str] = None
    wallet_type: Optional[str] = None
    sort_by: Optional[Literal["created_at", "title"]] = "created_at"
    sort_order: Optional[Literal["asc", "desc"]] = "asc"
