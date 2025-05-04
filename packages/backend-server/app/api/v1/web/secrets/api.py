from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.api_keys.schema import UpdateApiKey, AddApiKey,GetApiKeysList
from app.api.v1.web.api_keys.services import (
    delete_api_key,
    update_api_key,
    get_api_keys,
    get_api_key_details,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.secrets.schema import AddSecret,GetSecretsList
from app.api.v1.web.secrets.services import add_secret, get_secrets_details, get_secrets_list
router = APIRouter()
SECRETS = "/{workspace_id}/{project_id}/secrets"
SECRETS_LIST= "/{workspace_id}/{project_id}/secrets/list"
SECRETS_DETAILS = "/{workspace_id}/{project_id}/secrets/{doc_id}"


@router.post(SECRETS_LIST)
async def get_secrets_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: GetSecretsList,
    user: UserDetails = Depends(get_current_user),
):
    
    return await get_api_keys(user.get("db"), payload.model_dump(),request)



@router.post(SECRETS)
async def create_secrets_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddSecret,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await get_secrets_list(request, user, payload.model_dump(), background_tasks)


@router.put(SECRETS_DETAILS)
async def update_secrets_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    payload: UpdateApiKey,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return update_api_key(request, user, payload.model_dump(), background_tasks)


@router.delete(SECRETS_DETAILS)
async def delete_secrets_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return delete_api_key(request, user, background_tasks)
