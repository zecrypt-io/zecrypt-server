from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class Folder(BaseModel):
    name: str
    parent_id: Optional[str] = None  # Root folder if None

class RenameFolder(BaseModel):
    name: str
    folder_id: str
    parent_id: Optional[str] = None

class MoveFolder(BaseModel):
    folder_ids: List[str]
    parent_id: str