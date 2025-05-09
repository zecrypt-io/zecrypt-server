from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.wifi.schema import UpdateWifi, AddWifi
from app.api.v1.web.wifi.services import (
    delete_wifi,
    update_wifi,
    add_wifi,
    get_wifis,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import WIFI_DETAILS, WIFI

router = APIRouter()


@router.get(WIFI)
async def get_wifi_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):

    return get_wifis(user.get("db"), request)



@router.post(WIFI)
async def create_wifi_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddWifi,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return add_wifi(request, user, payload.model_dump(), background_tasks)


@router.put(WIFI_DETAILS)
async def update_wifi_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    payload: UpdateWifi,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return update_wifi(request, user, payload.model_dump(), background_tasks)


@router.delete(WIFI_DETAILS)
async def delete_wifi_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return delete_wifi(request, user, background_tasks)
