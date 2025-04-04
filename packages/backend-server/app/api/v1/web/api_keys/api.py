from fastapi import APIRouter, Request, Query, Depends

from app.api.v1.web.api_keys.schema import UpdateApiKey, AddApiKey
from app.api.v1.web.api_keys.services import (delete_api_key, update_api_key,add_api_key,get_api_keys, get_api_key_details)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user

from app.utils.utils import filter_payload

router = APIRouter()
API_KEYS = "/{project_id}/api-keys"
API_KEY_DETAILS = "/{project_id}/api-keys/{doc_id}"


@router.get(API_KEYS)
async def get_api_key_api(
    request: Request,
    project_id: str,
    page: int = Query(1, description="Page number", ge=1),
    limit: int = Query(20, description="Items per page", ge=1),
    user: UserDetails = Depends(get_current_user),
):
    query = {"project_id": project_id}
    return get_api_keys(user.get("db"), query, page=page, limit=limit)


@router.get(API_KEY_DETAILS)
async def get_api_key_details_api(
    request: Request,
    project_id: str,
    doc_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return get_api_key_details(user.get("db"), doc_id)


@router.post(API_KEYS)
async def create_api_keys_api(
    request: Request,
    project_id: str,
    payload: AddApiKey,
    user: UserDetails = Depends(get_current_user),
):
    payload = payload.model_dump()
    payload.update(
        {"project_id":project_id, "created_by": user.get("user_id")}
    )
    return add_api_key(user.get("db"),payload)


@router.put(API_KEY_DETAILS)
async def update_api_key_api(
    request: Request,
    project_id: str,
    doc_id: str,
    payload: UpdateApiKey,
    user: UserDetails = Depends(get_current_user),
):
    payload = filter_payload(payload.model_dump())
    payload.update(
        {"project_id": project_id, "last_updated_by": user.get("user_id")}
    )
    return update_api_key(user.get("db"), doc_id, payload)


@router.delete(API_KEY_DETAILS)
async def delete_api_keys_api(
    request: Request,
    project_id: str,
    doc_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return delete_api_key(user.get("db"),doc_id)
