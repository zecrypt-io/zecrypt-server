from fastapi import APIRouter, Depends, Request
from app.api.v1.web.auth.schema import UserDetails
from app.api.v1.web.workspace.services import get_workspace
from app.framework.permission_services.service import get_current_user

router = APIRouter()


@router.get("/workspace")
async def get_workspace_api(
    request: Request, user: UserDetails = Depends(get_current_user)
):
    query = {
        "user_id": user.user_id,
    }
    return get_workspace(query)
