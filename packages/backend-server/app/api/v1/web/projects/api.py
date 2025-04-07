from fastapi import APIRouter, Request, Query, Depends

from app.api.v1.web.auth.schema import UserDetails
from app.api.v1.web.projects.schema import AddProject, UpdateProject
from app.api.v1.web.projects.services import (
    get_projects,
    get_project_details,
    update_project,
    add_project,
    delete_project,
)
from app.framework.permission_services.service import get_current_user
from app.utils.utils import filter_payload

router = APIRouter()
PROJECTS = "/{workspace_id}/projects"
PROJECT_DETAILS = "/{workspace_id}/projects/{doc_id}"


@router.get(PROJECT_DETAILS)
async def get_project_api(
    request: Request,
    workspace_id: str,
    page: int = Query(1, description="Page number", ge=1),
    limit: int = Query(20, description="Items per page", ge=1),
    user: UserDetails = Depends(get_current_user),
):
    query = {"workspace_id": workspace_id}
    return get_projects(user.get("db"), query, page=page, limit=limit)


@router.get(PROJECT_DETAILS)
async def get_project_details_api(
    request: Request,
    workspace_id: str,
    doc_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return get_project_details(user.get("db"), doc_id)


@router.post(PROJECTS)
async def create_project_api(
    request: Request,
    workspace_id: str,
    payload: AddProject,
    user: UserDetails = Depends(get_current_user),
):
    payload = payload.model_dump()
    payload.update({"workspace_id": workspace_id, "created_by": user.get("user_id")})
    return add_project(user.get("db"), payload)


@router.put(PROJECT_DETAILS)
async def update_project_api(
    request: Request,
    workspace_id: str,
    doc_id: str,
    payload: UpdateProject,
    user: UserDetails = Depends(get_current_user),
):
    payload = filter_payload(payload.model_dump())
    payload.update({"workspace_id": workspace_id, "updated_by": user.get("user_id")})
    return update_project(user.get("db"), doc_id, payload)


@router.delete(PROJECT_DETAILS)
async def delete_project_api(
    request: Request,
    workspace_id: str,
    doc_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return delete_project(user.get("db"), doc_id)
