from fastapi import APIRouter, Depends, Request
from app.api.v1.web.dashboard.services import (
    get_dashboard_overview,
    get_dashboard_recent_activity,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import (
    DASHBOARD_OVERVIEW,
    DASHBOARD_RECENT_ACTIVITY,
)

router = APIRouter()


@router.get(DASHBOARD_OVERVIEW)
async def get_dashboard_overview_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return await get_dashboard_overview(request, user)


@router.get(DASHBOARD_RECENT_ACTIVITY)
async def get_dashboard_recent_activity_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return await get_dashboard_recent_activity(request, user)
