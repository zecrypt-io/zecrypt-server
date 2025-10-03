from fastapi import APIRouter
from app.api.v1.web.drive.folders import api as folders_router
  

router = APIRouter()

router.prefix = "/drive"

router.include_router(folders_router.router, tags=["Drive: Folders"])