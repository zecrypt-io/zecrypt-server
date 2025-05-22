from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.identity.schema import (
    UpdateIdentity,
    AddIdentity,
)
from app.api.v1.web.secrets.services import (
    delete_secret,
    update_secret,
    add_secret,
    get_secrets,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import IDENTITY_DETAILS, IDENTITY
from app.utils.constants import SECRET_TYPE_IDENTITY as data_type
router = APIRouter()


@router.get(IDENTITY)
async def get_identity_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return await get_secrets(request, user, data_type)


@router.post(IDENTITY)
async def create_identities_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddIdentity,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await add_secret(request, user, data_type, payload.model_dump(), background_tasks)


@router.put(IDENTITY_DETAILS)
async def update_identity_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    payload: UpdateIdentity,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await update_secret(request, user, data_type, payload.model_dump(), background_tasks)


@router.delete(IDENTITY_DETAILS)
async def delete_identity_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await delete_secret(request, user, data_type, background_tasks)
