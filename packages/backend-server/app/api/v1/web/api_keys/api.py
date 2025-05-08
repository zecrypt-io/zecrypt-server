from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.api_keys.schema import UpdateApiKey, AddApiKey
from app.api.v1.web.api_keys.services import (
    delete_api_key,
    update_api_key,
    add_api_key,
    get_api_keys,
    get_api_key_details,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import API_KEY_DETAILS, API_KEYS

router = APIRouter()


@router.get(API_KEYS)
async def get_api_key_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return get_api_keys(user.get("db"), request)


@router.post(API_KEYS)
async def create_api_keys_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddApiKey,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return add_api_key(request, user, payload.model_dump(), background_tasks)


@router.put(API_KEY_DETAILS)
async def update_api_key_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    payload: UpdateApiKey,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return update_api_key(request, user, payload.model_dump(), background_tasks)


@router.delete(API_KEY_DETAILS)
async def delete_api_keys_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return delete_api_key(request, user, background_tasks)
