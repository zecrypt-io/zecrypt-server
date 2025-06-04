from typing import Optional, Any


from app.framework.mongo_db.base_model import BaseModel


class AddPasswordHistory(BaseModel):
    data: Optional[Any] = None
