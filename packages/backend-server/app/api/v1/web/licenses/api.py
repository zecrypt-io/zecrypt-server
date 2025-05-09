from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.licenses.schema import UpdateLicense, AddLicense
from app.api.v1.web.licenses.services import (
    delete_license,
    update_license,
    add_license,
    get_licenses,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import LICENSE_DETAILS, LICENSE

router = APIRouter()


@router.get(LICENSE)
async def get_license_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return get_licenses(user.get("db"), request)


@router.post(LICENSE)
async def create_license_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddLicense,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return add_license(request, user, payload.model_dump(), background_tasks)


@router.put(LICENSE_DETAILS)
async def update_license_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    payload: UpdateLicense,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return update_license(request, user, payload.model_dump(), background_tasks)


@router.delete(LICENSE_DETAILS)
async def delete_license_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return delete_license(request, user, background_tasks)
