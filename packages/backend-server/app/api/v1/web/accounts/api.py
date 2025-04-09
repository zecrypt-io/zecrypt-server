from fastapi import APIRouter, Request, Query, Depends, BackgroundTasks

from app.api.v1.web.accounts.schema import AddAccount, UpdateAccount
from app.api.v1.web.accounts.service import (
    get_accounts,
    get_account_details,
    add_account,
    update_account,
    delete_account,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.utils.utils import filter_payload

router = APIRouter()
ACCOUNTS = "/{workspace_id}/{project_id}/accounts"
ACCOUNT_DETAILS = "/{workspace_id}/{project_id}/accounts/{doc_id}"


@router.get(ACCOUNTS)
async def get_accounts_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    page: int = Query(1, description="Page number", ge=1),
    limit: int = Query(20, description="Items per page", ge=1),
    user: UserDetails = Depends(get_current_user),
):
    query = {"project_id": project_id}
    return get_accounts(user.get("db"), query, sort=("name", 1), page=page, limit=limit)


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
    project_id: str,
    payload: AddAccount,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    payload = payload.model_dump()
    payload.update({"project_id": project_id, "created_by": user.get("user_id")})
    return add_account(user.get("db"), payload, background_tasks)


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
    payload = payload.model_dump()
    payload.update({"project_id": project_id, "updated_by": user.get("user_id")})
    return update_account(user.get("db"), doc_id, payload, background_tasks)


@router.delete(ACCOUNT_DETAILS)
async def delete_account_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return delete_account(user.get("db"), doc_id, user.get("user_id"), background_tasks)
