
from typing import Optional, List

from app.framework.mongo_db.base_model import BaseModel
from pydantic import Field


class AddFavoriteTags(BaseModel):
    tag_to_add: List[str]= Field(default_factory=list)
    tag_to_remove: List[str]= Field(default_factory=list)

