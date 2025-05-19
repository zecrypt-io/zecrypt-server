from typing import Optional

from app.framework.mongo_db.base_model import BaseModel


class AddProject(BaseModel):
    name: str
    key: Optional[str] = None
    description: Optional[str]
    is_default: Optional[bool] = False
    color: Optional[str] = None
    features: dict = {}


class UpdateProject(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_default: Optional[bool] = None
    color: Optional[str] = None
    features: Optional[dict] = None
