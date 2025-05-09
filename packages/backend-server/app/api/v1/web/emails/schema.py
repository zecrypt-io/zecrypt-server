from typing import Optional, List, Any
from pydantic import Field


from app.framework.mongo_db.base_model import BaseModel


class AddEmail(BaseModel):
    title: str
    data: Optional[Any] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)


class UpdateEmail(BaseModel):
    title: Optional[str] = None
    data: Optional[Any] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

