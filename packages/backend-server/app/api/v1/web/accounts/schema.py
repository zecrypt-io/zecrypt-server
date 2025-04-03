from typing import Optional, List

from pydantic import BaseModel, Field



class AddAccount(BaseModel):
    name: str
    project_id: str
    user_name: str
    password: str
    website: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)

class UpdateAccount(BaseModel):
    name: Optional[str] = None
    project_id: Optional[str] = None
    user_name: Optional[str] = None
    password: Optional[str] = None
    website: Optional[str] = None
    tags: Optional[List[str]] = []