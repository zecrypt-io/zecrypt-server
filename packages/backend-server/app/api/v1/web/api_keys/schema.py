from typing import Optional, Literal, List
from pydantic import BaseModel, Field


from app.framework.mongo_db.base_model import BaseModel


class AddApiKey(BaseModel):
    name: str
    api_key: str
    description: Optional[str]
    status: Optional[Literal["active", "expired"]] = "active"
    env: Optional[Literal["Development", "Production", "Staging"]] = "Development"
    tags: Optional[List[str]] = Field(default_factory=list)


class UpdateApiKey(BaseModel):
    name: Optional[str] = None
    api_key: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal["active", "expired"]] = None
    env: Optional[Literal["Development", "Production", "Staging"]] = None
    tags: Optional[List[str]] = None