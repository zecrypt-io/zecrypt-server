from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.secrets.notes.schema import UpdateNote, AddNote
from app.api.v1.web.secrets.services import (
    delete_secret,
    update_secret,
    add_secret,
    get_secrets,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import NOTE_DETAILS, NOTES
from app.utils.constants import SECRET_TYPE_NOTE as data_type

router = APIRouter()


@router.get(NOTES)
async def get_note_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return await get_secrets(request, user, data_type)


@router.post(NOTES)
async def create_note_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddNote,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await add_secret(
        request, user, data_type, payload.model_dump(), background_tasks
    )


@router.put(NOTE_DETAILS)
async def update_note_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    payload: UpdateNote,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await update_secret(
        request, user, data_type, payload.model_dump(), background_tasks
    )


@router.delete(NOTE_DETAILS)
async def delete_note_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await delete_secret(request, user, data_type, background_tasks)
