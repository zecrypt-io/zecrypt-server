from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.accounts.schema import AddAccount, UpdateAccount, GetAccountsList
from app.api.v1.web.accounts.service import (
    get_accounts,
    get_account_details,
    add_account,
    update_account,
    delete_account,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import ACCOUNTS_LIST, ACCOUNT_DETAILS, ACCOUNTS

router = APIRouter()


@router.post(ACCOUNTS_LIST)
async def get_accounts_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: GetAccountsList,
    user: UserDetails = Depends(get_current_user),
):

    return get_accounts(user.get("db"), payload.model_dump(), request)


@router.get(ACCOUNT_DETAILS)
async def get_account_details_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return get_account_details(user.get("db"), doc_id)


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
