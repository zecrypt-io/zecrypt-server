from typing import Optional, Literal, List, Any
from pydantic import  Field


from app.framework.mongo_db.base_model import BaseModel


class AddApiKey(BaseModel):
    env: Optional[Literal["Development", "Production", "Staging", "Testing", "Local", "UAT"]] = "Development"


class UpdateApiKey(BaseModel):
    env: Optional[Literal["Development", "Production", "Staging", "Testing", "Local", "UAT"]] = None


class AddAccount(BaseModel):
    url: Optional[str] = None


class AddWallet(BaseModel):
    wallet_type: Optional[str] = None

