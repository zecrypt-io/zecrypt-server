from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.wifi.schema import UpdateWifi, AddWifi, GetWifisList
from app.api.v1.web.wifi.services import (
    delete_wifi,
    update_wifi,
    add_wifi,
    get_wifis,
    get_wifi_details,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user


router = APIRouter()
WIFIS = "/{workspace_id}/{project_id}/wifi"
WIFIS_LIST= "/{workspace_id}/{project_id}/wifi/list"
WIFIS_DETAILS = "/{workspace_id}/{project_id}/wifi/{doc_id}"


@router.post(WIFIS_LIST)
async def get_wifi_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: GetWifisList,
    user: UserDetails = Depends(get_current_user),
):
    
    return get_wifis(user.get("db"), payload.model_dump(),request)


@router.get(WIFIS_DETAILS)
async def get_wifi_details_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return get_wifi_details(user.get("db"), doc_id)


@router.post(WIFIS)
async def create_wifis_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddWifi,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return add_wifi(request, user, payload.model_dump(), background_tasks)


@router.put(WIFIS_DETAILS)
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


@router.delete(WIFIS_DETAILS)
async def delete_wifi_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return delete_wifi(request, user, background_tasks)
