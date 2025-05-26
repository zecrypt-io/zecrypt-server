from typing import Optional, List, Any
from pydantic import Field


from app.framework.mongo_db.base_model import BaseModel


class AddNote(BaseModel):
    title: str
    data: Optional[Any] = None
    tags: Optional[List[str]] = Field(default_factory=list)


class UpdateNote(BaseModel):
    title: Optional[str] = None
    data: Optional[Any] = None
    tags: Optional[List[str]] = None
