from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.accounts.schema import AddAccount, UpdateAccount
from app.api.v1.web.accounts.service import (
    get_accounts,
    add_account,
    update_account,
    delete_account,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import ACCOUNT_DETAILS, ACCOUNTS

router = APIRouter()


@router.get(ACCOUNTS)
async def get_accounts_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return get_accounts(user.get("db"), request)


@router.post(ACCOUNTS)
async def create_account_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddAccount,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return add_account(request, user, payload.model_dump(), background_tasks)


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
    return update_account(request, user, payload.model_dump(), background_tasks)


@router.delete(ACCOUNT_DETAILS)
async def delete_account_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return delete_account(request, user, background_tasks)
