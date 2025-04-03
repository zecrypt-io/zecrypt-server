from fastapi import APIRouter
from app.api.v1.web.api import api_router as web_api_router

api_router = APIRouter()
api_router.prefix = "/api/v1"

api_router.include_router(web_api_router, tags=["Web API"])
