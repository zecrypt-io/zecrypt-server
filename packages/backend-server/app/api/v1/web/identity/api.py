from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.identity.schema import (
    UpdateIdentity,
    AddIdentity,
)
from app.api.v1.web.identity.services import (
    delete_identity,
    update_identity,
    add_identity,
    get_identities,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import IDENTITY_DETAILS, IDENTITY

router = APIRouter()


@router.get(IDENTITY)
async def get_identity_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):

    return get_identities(user.get("db"), request)


@router.post(IDENTITY)
async def create_identities_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddIdentity,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return add_identity(request, user, payload.model_dump(), background_tasks)


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
    return update_identity(request, user, payload.model_dump(), background_tasks)


@router.delete(IDENTITY_DETAILS)
async def delete_identity_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return delete_identity(request, user, background_tasks)
