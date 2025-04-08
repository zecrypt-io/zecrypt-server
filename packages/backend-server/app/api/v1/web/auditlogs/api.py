from fastapi import APIRouter, Depends, Query
from app.api.v1.web.auditlogs.services import get_audit_logs
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.auth.schema import UserDetails

router = APIRouter()
AUDIT_LOGS="/audit-logs"
@router.get(AUDIT_LOGS)
async def get_audit_logs_api(
    skip: int = Query(default=0, description="Skip"),
    limit: int = Query(default=20, description="Limit"),
    user: UserDetails = Depends(get_current_user),
):  
    return get_audit_logs(user.get("db"), skip, limit)
