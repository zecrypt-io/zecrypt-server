from typing import Optional, Literal, List, Any
from pydantic import Field


from app.framework.mongo_db.base_model import BaseModel


class AddWifi(BaseModel):
    title: str
    security_type: Optional[str] = None
    data: Optional[Any] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)


class UpdateWifi(BaseModel):
    title: Optional[str] = None
    security_type: Optional[str] = None
    data: Optional[Any] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

