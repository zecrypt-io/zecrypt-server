from typing import Optional, Literal, List, Any, Tuple
from pydantic import BaseModel, Field


from app.framework.mongo_db.base_model import BaseModel


class AddApiKey(BaseModel):
    name: str
    data: Optional[Any] = None
    description: Optional[str]
    status: Optional[Literal["active", "expired"]] = "active"
    env: Optional[Literal["Development", "Production", "Staging"]] = "Development"
    tags: Optional[List[str]] = Field(default_factory=list)


class UpdateApiKey(BaseModel):
    name: Optional[str] = None
    data: Optional[Any] = None
    description: Optional[str] = None
    status: Optional[Literal["active", "expired"]] = None
    env: Optional[Literal["Development", "Production", "Staging"]] = None
    tags: Optional[List[str]] = None



class GetApiKeysList(BaseModel):
    page: int 
    limit: int 
    tags: Optional[List[str]] = Field(default_factory=list)
    status: Optional[Literal["active", "expired"]] = None
    env: Optional[Literal["Development", "Production", "Staging"]] = None
    sort: Optional[Tuple[str, int]] = None
    name: Optional[str] = None