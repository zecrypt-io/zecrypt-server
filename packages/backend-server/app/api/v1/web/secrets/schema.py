
from typing import Optional, Literal, List, Any
from pydantic import  Field


from app.framework.mongo_db.base_model import BaseModel


class AddSecret(BaseModel):
    title: str
    data: Optional[Any] = None
    description: Optional[str]=None
    tags: Optional[List[str]] = Field(default_factory=list)
    secret_type: Literal["login", "api_key", "wallet_address","identity","card","wifi","software_license"] = "login"
    payload: dict


class GetSecretsList(BaseModel):
    page: int
    limit: int
    tags: Optional[List[str]] = Field(default_factory=list)
    title: Optional[str] = None
    secret_type: Optional[Literal["login", "api_key", "wallet_address","identity","card","wifi","software_license"]] = "login"
    sort_by: Optional[Literal["title", "created_at"]] = "created_at"
    sort_order: Optional[Literal["asc", "desc"]] = "asc"