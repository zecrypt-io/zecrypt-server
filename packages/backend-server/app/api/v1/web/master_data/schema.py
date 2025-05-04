from typing import Optional, Literal, List, Any
from pydantic import  Field


from app.framework.mongo_db.base_model import BaseModel


class AddApiKey(BaseModel):
    env: Optional[Literal["Development", "Production", "Staging"]] = "Development"


class UpdateApiKey(BaseModel):
    env: Optional[Literal["Development", "Production", "Staging"]] = None


class AddAccount(BaseModel):
    url: Optional[str] = None


class AddWallet(BaseModel):
    wallet_type: Optional[str] = None


class AddIdentity(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None
    passport_number: Optional[str] = None
    national_id: Optional[str] = None
 

class GetApiKeysList(BaseModel):
    page: int 
    limit: int 
    tags: Optional[List[str]] = Field(default_factory=list)
    name: Optional[str] = None
    sort_by: Optional[Literal["created_at", "name"]] = "created_at"
    sort_order: Optional[Literal["asc", "desc"]] = "asc"