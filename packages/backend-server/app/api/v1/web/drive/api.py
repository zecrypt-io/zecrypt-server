from fastapi import APIRouter
from app.api.v1.web.drive.folders import api as folders_router
  

api_router = APIRouter()

api_router.prefix = "/drive"

api_router.include_router(folders_router.router, tags=["Drive: Folders"])