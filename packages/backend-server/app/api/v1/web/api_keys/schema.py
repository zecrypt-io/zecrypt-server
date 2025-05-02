from typing import Optional, Literal, List, Any
from pydantic import  Field


from app.framework.mongo_db.base_model import BaseModel


class AddApiKey(BaseModel):
    name: str
    data: Optional[Any] = None
    description: Optional[str]
    env: Optional[Literal["Development", "Production", "Staging"]] = "Development"
    tags: Optional[List[str]] = Field(default_factory=list)


class UpdateApiKey(BaseModel):
    name: Optional[str] = None
    data: Optional[Any] = None
    description: Optional[str] = None
    env: Optional[Literal["Development", "Production", "Staging"]] = None
    tags: Optional[List[str]] = None



class GetApiKeysList(BaseModel):
    page: int 
    limit: int 
    tags: Optional[List[str]] = Field(default_factory=list)
    env: Optional[Literal["Development", "Production", "Staging"]] = None
    name: Optional[str] = None
    sort_by: Optional[Literal["created_at", "name"]] = "created_at"
    sort_order: Optional[Literal["asc", "desc"]] = "asc"