from fastapi import APIRouter, Depends, Request
from app.api.v1.web.auth.schema import UserDetails
from app.api.v1.web.workspace.services import load_initial_data, get_tags
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import LOAD_INITIAL_DATA, TAGS


router = APIRouter()


@router.post(LOAD_INITIAL_DATA)
async def load_initial_data_api(
    request: Request, user: UserDetails = Depends(get_current_user)
):
    return load_initial_data(request, user)


@router.get(TAGS)
async def get_tags_api(
    request: Request, workspace_id: str, user: UserDetails = Depends(get_current_user)
):
    return get_tags(request, user)
