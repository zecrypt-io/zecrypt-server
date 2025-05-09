from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.ssh_keys.schema import UpdateSshKey, AddSshKey
from app.api.v1.web.ssh_keys.services import (
    delete_ssh_key,
    update_ssh_key,
    add_ssh_key,
    get_ssh_keys,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import SSH_KEY_DETAILS, SSH_KEYS

router = APIRouter()


@router.get(SSH_KEYS)
async def get_ssh_key_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return get_ssh_keys(user.get("db"), request)


@router.post(SSH_KEYS)
async def create_ssh_key_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddSshKey,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return add_ssh_key(request, user, payload.model_dump(), background_tasks)


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
    return update_ssh_key(request, user, payload.model_dump(), background_tasks)


@router.delete(SSH_KEY_DETAILS)
async def delete_ssh_key_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return delete_ssh_key(request, user, background_tasks)
