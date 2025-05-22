from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.api_keys.schema import UpdateApiKey, AddApiKey
from app.api.v1.web.secrets.services import (
    delete_secret,
    update_secret,
    add_secret,
    get_secrets,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import API_KEY_DETAILS, API_KEYS
from app.utils.constants import SECRET_TYPE_API_KEY as data_type

router = APIRouter()


@router.get(API_KEYS)
async def get_api_key_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return await get_secrets(request, user, data_type)


@router.post(API_KEYS)
async def create_api_keys_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddApiKey,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await add_secret(
        request, user, data_type, payload.model_dump(), background_tasks
    )


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
    return await update_secret(
        request, user, data_type, payload.model_dump(), background_tasks
    )


@router.delete(API_KEY_DETAILS)
async def delete_api_keys_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await delete_secret(request, user, data_type, background_tasks)
