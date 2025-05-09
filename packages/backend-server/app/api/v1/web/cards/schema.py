from typing import Optional, List, Any
from pydantic import Field


from app.framework.mongo_db.base_model import BaseModel


class AddCard(BaseModel):
    title: str
    data: Optional[Any] = None
    brand: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)


class UpdateCard(BaseModel):
    title: Optional[str] = None
    data: Optional[Any] = None
    brand: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

