from fastapi import APIRouter
from app.api.v1.web.accounts import api as accounts_router


api_router = APIRouter()

api_router.prefix = "/web"

api_router.include_router(accounts_router.router)

