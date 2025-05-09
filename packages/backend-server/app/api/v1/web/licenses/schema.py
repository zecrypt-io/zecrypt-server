from typing import Optional, List, Any
from pydantic import Field


from app.framework.mongo_db.base_model import BaseModel


class AddLicense(BaseModel):
    title: str
    data: Optional[Any] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    expires_at: Optional[str] = None


class UpdateLicense(BaseModel):
    title: Optional[str] = None
    data: Optional[Any] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    expires_at: Optional[str] = None

