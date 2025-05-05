from fastapi import APIRouter
from app.api.v1.web.accounts import api as accounts_router
from app.api.v1.web.auth import api as auth_router
from app.api.v1.web.projects import api as projects_router
from app.api.v1.web.api_keys import api as api_keys_router
from app.api.v1.web.wallet_phrases import api as wallet_phrases_router
from app.api.v1.web.workspace import api as workspace_router
from app.api.v1.web.audit_logs import api as audit_logs_router
from app.api.v1.web.user import api as user_router
from app.api.v1.web.emails import api as emails_router
api_router = APIRouter()

api_router.prefix = "/web"

api_router.include_router(auth_router.router, tags=["Web Auth"])
api_router.include_router(accounts_router.router, tags=["Web Accounts"])
api_router.include_router(api_keys_router.router, tags=["Web API Keys"])
api_router.include_router(emails_router.router, tags=["Web Emails"])
api_router.include_router(wallet_phrases_router.router, tags=["Web Wallet Phrases"])
api_router.include_router(workspace_router.router, tags=["Web Workspace"])
api_router.include_router(projects_router.router, tags=["Web Projects"])
api_router.include_router(audit_logs_router.router, tags=["Web Audit Logs"])
api_router.include_router(user_router.router, tags=["Web User"])