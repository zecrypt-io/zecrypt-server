from fastapi import APIRouter, Depends, Request
from app.api.v1.web.auth.schema import UserDetails
from app.api.v1.web.workspace.services import get_workspace, load_initial_data
from app.framework.permission_services.service import get_current_user

router = APIRouter()

WORKSPACE_DETAILS = "/workspace"
LOAD_INITIAL_DATA = "/load-initial-data"

@router.get(WORKSPACE_DETAILS)
async def get_workspace_api(
    request: Request, user: UserDetails = Depends(get_current_user)
):

    query = {
        "created_by": user.get("user_id"),
    }
    return get_workspace(query, user.get("db"))


@router.post(LOAD_INITIAL_DATA)
async def load_initial_data_api(
    request: Request, user: UserDetails = Depends(get_current_user)
):
    return load_initial_data(user.get("db"))
