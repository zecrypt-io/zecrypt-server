from app.framework.mongo_db.base_model import BaseModel
from typing import Optional, Any


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

