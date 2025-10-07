from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class RenameFile(BaseModel):
    name: str = Field(..., description="File name")
    file_id: str = Field(..., description="File ID")
    parent_id: Optional[str] = Field(None, description="Parent folder ID, None for root")

class MoveFile(BaseModel):
    file_ids: List[str] = Field(..., description="File IDs")
    parent_id: str = Field(..., description="Parent folder ID")

class DeleteFiles(BaseModel):
    file_ids: List[str] = Field(..., description="File IDs")

class GetPresignedUrl(BaseModel):
    file_type: str = Field(..., description="File type")
    name: str = Field(..., description="File name")
    size: int = Field(..., description="File size")
    file_path: str = Field(..., description="File path")
    parent_id: Optional[str] = Field(None, description="Parent folder ID")