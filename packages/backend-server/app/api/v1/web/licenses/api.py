from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.licenses.schema import UpdateLicense, AddLicense, GetLicensesList
from app.api.v1.web.licenses.services import (
    delete_license,
    update_license,
    add_license,
    get_licenses,
    get_license_details,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user


router = APIRouter()
LICENSES = "/{workspace_id}/{project_id}/licenses"
LICENSE_LIST = "/{workspace_id}/{project_id}/licenses/list"
LICENSE_DETAILS = "/{workspace_id}/{project_id}/licenses/{doc_id}"


@router.post(LICENSE_LIST)
async def get_license_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: GetLicensesList,
    user: UserDetails = Depends(get_current_user),
):

    return get_licenses(user.get("db"), payload.model_dump(), request)


@router.get(LICENSE_DETAILS)
async def get_license_details_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return get_license_details(user.get("db"), doc_id)


@router.post(LICENSES)
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
