from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.emails.schema import UpdateEmail, AddEmail
from app.api.v1.web.emails.services import (
    delete_email,
    update_email,
    add_email,
    get_emails,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import EMAIL_DETAILS, EMAILS

router = APIRouter()


@router.get(EMAILS)
async def get_email_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return get_emails(user.get("db"), request)


@router.post(EMAILS)
async def create_emails_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddEmail,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return add_email(request, user, payload.model_dump(), background_tasks)


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
    return update_email(request, user, payload.model_dump(), background_tasks)


@router.delete(EMAIL_DETAILS)
async def delete_email_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return delete_email(request, user, background_tasks)
