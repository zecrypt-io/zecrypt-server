from typing import Optional, Literal, List, Any
from pydantic import Field


from app.framework.mongo_db.base_model import BaseModel


class AddApiKey(BaseModel):
    title: str
    data: Optional[Any] = None
    notes: Optional[str] = None
    env: Optional[
        Literal["Development", "Production", "Staging", "Testing", "Local", "UAT"]
    ] = "Development"
    tags: Optional[List[str]] = Field(default_factory=list)


class UpdateApiKey(BaseModel):
    title: Optional[str] = None
    data: Optional[Any] = None
    notes: Optional[str] = None
    env: Optional[
        Literal["Development", "Production", "Staging", "Testing", "Local", "UAT"]
    ] = None
    tags: Optional[List[str]] = None
