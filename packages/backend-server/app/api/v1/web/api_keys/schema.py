from typing import Optional, Literal

from app.framework.mongo_db.base_model import BaseModel


class AddApiKey(BaseModel):
    name: str
    key: str
    description: Optional[str]
    status: Optional[Literal["active", "expired"]] = "active"
    env: Optional[Literal["Development", "Production", "Staging"]] = "Development"


class UpdateApiKey(BaseModel):
    name: Optional[str] = None
    key: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal["active", "expired"]] = None
    env: Optional[Literal["Development", "Production", "Staging"]] = None
