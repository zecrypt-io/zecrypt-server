from typing import Optional, List, Any
from pydantic import Field


from app.framework.mongo_db.base_model import BaseModel


class AddPasswordHistory(BaseModel):
    data: Optional[Any] = None