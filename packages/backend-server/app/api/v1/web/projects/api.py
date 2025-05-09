from fastapi import APIRouter, Request, Query, Depends, BackgroundTasks

from app.api.v1.web.auth.schema import UserDetails
from app.api.v1.web.projects.schema import AddProject, UpdateProject
from app.api.v1.web.projects.services import (
    get_projects,
    get_project_details,
    update_project,
    add_project,
    delete_project,
    get_tags,
)
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import PROJECTS, PROJECT_DETAILS, TAGS

router = APIRouter()


@router.get(PROJECTS)
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
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return add_project(request, user, payload.model_dump(), background_tasks)


@router.put(PROJECT_DETAILS)
async def update_project_api(
    request: Request,
    workspace_id: str,
    doc_id: str,
    payload: UpdateProject,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return update_project(request, user, payload.model_dump(), background_tasks)


@router.delete(PROJECT_DETAILS)
async def delete_project_api(
    request: Request,
    workspace_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return delete_project(request, user, background_tasks)


@router.get(TAGS)
async def get_project_tags_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return get_tags(user.get("db"), project_id)
