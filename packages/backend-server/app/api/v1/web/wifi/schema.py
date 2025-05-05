from typing import Optional, Literal, List, Any
from pydantic import Field


from app.framework.mongo_db.base_model import BaseModel


class AddWifi(BaseModel):
    title: str
    data: Optional[Any] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)


class UpdateWifi(BaseModel):
    title: Optional[str] = None
    data: Optional[Any] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class GetWifisList(BaseModel):
    page: int
    limit: int
    tags: Optional[List[str]] = Field(default_factory=list)
    title: Optional[str] = None
    sort_by: Optional[Literal["created_at", "title"]] = "created_at"
    sort_order: Optional[Literal["asc", "desc"]] = "asc"
