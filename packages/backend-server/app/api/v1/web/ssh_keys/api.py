from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.ssh_keys.schema import UpdateSshKey, AddSshKey
from app.api.v1.web.secrets.services import (
    delete_secret,
    update_secret,
    add_secret,
    get_secrets,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import SSH_KEY_DETAILS, SSH_KEYS
from app.utils.constants import SECRET_TYPE_SSH_KEY as data_type
router = APIRouter()


@router.get(SSH_KEYS)
async def get_ssh_key_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return await get_secrets(request, user, data_type)


@router.post(SSH_KEYS)
async def create_ssh_key_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddSshKey,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await add_secret(request, user, data_type, payload.model_dump(), background_tasks)


@router.put(SSH_KEY_DETAILS)
async def update_ssh_key_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    payload: UpdateSshKey,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await update_secret(request, user, data_type, payload.model_dump(), background_tasks)


@router.delete(SSH_KEY_DETAILS)
async def delete_ssh_key_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await delete_secret(request, user, data_type, background_tasks)
