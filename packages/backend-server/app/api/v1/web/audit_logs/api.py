from fastapi import APIRouter, Depends, Request
from app.api.v1.web.audit_logs.services import get_audit_logs, get_audit_log_actions
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.auth.schema import UserDetails
from app.api.v1.web.audit_logs.schema import AuditLogList
router = APIRouter()
AUDIT_LOGS="/{workspace_id}/audit-logs"



@router.post(AUDIT_LOGS)
async def get_audit_logs_api(
    workspace_id: str,
    payload: AuditLogList,
    request: Request,
    user: UserDetails = Depends(get_current_user),
):  
    return get_audit_logs(user.get("db"), payload.model_dump(), request)

    
@router.get("/audit-log-actions")          
async def get_audit_log_actions_api(
    user: UserDetails = Depends(get_current_user),
):
    return get_audit_log_actions()
