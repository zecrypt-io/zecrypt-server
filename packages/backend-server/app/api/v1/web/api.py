from fastapi import APIRouter
from app.api.v1.web.auth import api as auth_router
from app.api.v1.web.projects import api as projects_router
from app.api.v1.web.workspace import api as workspace_router
from app.api.v1.web.audit_logs import api as audit_logs_router
from app.api.v1.web.user import api as user_router
from app.api.v1.web.secrets import api as secrets_router
from app.api.v1.web.dashboard import api as dashboard_router
from app.api.v1.web.drive import api as drive_router
api_router = APIRouter()

api_router.prefix = "/web"

api_router.include_router(auth_router.router, tags=["Authentication"])
api_router.include_router(audit_logs_router.router, tags=["Audit Logs"])
api_router.include_router(projects_router.router, tags=["Projects"])
api_router.include_router(secrets_router.secrets_router)
api_router.include_router(user_router.router, tags=["User"])
api_router.include_router(workspace_router.router, tags=["Workspace"])
api_router.include_router(dashboard_router.router, tags=["Dashboard"])
api_router.include_router(drive_router.router)

