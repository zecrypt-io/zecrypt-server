from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.secrets.accounts.schema import AddAccount, UpdateAccount
from app.api.v1.web.secrets.services import (
    get_secrets,
    add_secret,
    update_secret,
    delete_secret,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import ACCOUNT_DETAILS, ACCOUNTS
from app.utils.constants import SECRET_TYPE_LOGIN as data_type

router = APIRouter()


@router.get(ACCOUNTS)
async def get_accounts_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return await get_secrets(request, user, data_type)


@router.post(ACCOUNTS)
async def create_account_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddAccount,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await add_secret(
        request, user, data_type, payload.model_dump(), background_tasks
    )


@router.put(ACCOUNT_DETAILS)
async def update_account_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    payload: UpdateAccount,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await update_secret(
        request, user, data_type, payload.model_dump(), background_tasks
    )


@router.delete(ACCOUNT_DETAILS)
async def delete_account_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await delete_secret(request, user, data_type, background_tasks)
