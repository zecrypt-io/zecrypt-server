from pydantic import BaseModel


class AuditLogList(BaseModel):
    page: int
    limit: int
