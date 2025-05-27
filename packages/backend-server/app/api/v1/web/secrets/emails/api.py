from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.secrets.emails.schema import UpdateEmail, AddEmail
from app.api.v1.web.secrets.services import (
    delete_secret,
    update_secret,
    add_secret,
    get_secrets,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import EMAIL_DETAILS, EMAILS
from app.utils.constants import SECRET_TYPE_EMAIL as data_type

router = APIRouter()


@router.get(EMAILS)
async def get_email_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return await get_secrets(request, user, data_type)


@router.post(EMAILS)
async def create_emails_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddEmail,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await add_secret(
        request, user, data_type, payload.model_dump(), background_tasks
    )


@router.put(EMAIL_DETAILS)
async def update_email_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    payload: UpdateEmail,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await update_secret(
        request, user, data_type, payload.model_dump(), background_tasks
    )


@router.delete(EMAIL_DETAILS)
async def delete_email_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await delete_secret(request, user, data_type, background_tasks)
