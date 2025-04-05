from app.framework.mongo_db.base_model import BaseModel
from typing import Optional
from datetime import datetime

class WalletPhrase(BaseModel):
    title: str
    phrase: str
    wallet_address: Optional[str] = None
    wallet_type: Optional[str] = None
    tag: Optional[list[str]] = None
   

class UpdateWalletPhrase(BaseModel):
    title: Optional[str] = None
    phrase: Optional[str] = None
    wallet_address: Optional[str] = None
    wallet_type: Optional[str] = None
    tag: Optional[list[str]] = None
