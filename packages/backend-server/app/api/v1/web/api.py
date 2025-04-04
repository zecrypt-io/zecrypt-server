from fastapi import APIRouter
from app.api.v1.web.accounts import api as accounts_router
from app.api.v1.web.auth import api as auth_router
from app.api.v1.web.projects import api as projects_router
from app.api.v1.web.api_keys import api as api_keys_router


api_router = APIRouter()

api_router.prefix = "/web"

api_router.include_router(accounts_router.router)
api_router.include_router(auth_router.router)
api_router.include_router(api_keys_router.router)
api_router.include_router(projects_router.router)
