from fastapi import APIRouter, Depends, Request
from app.api.v1.web.auth.schema import UserDetails
from app.api.v1.web.user.services import (
    get_favorite_tags,
    update_favorite_tags,
    get_profile,
    get_login_history,
    update_profile,
)
from app.api.v1.web.user.schema import AddFavoriteTags, UpdateProfile
from app.framework.permission_services.service import get_current_user

router = APIRouter()

FAVORITE_TAGS = "/favorite-tags"
PROFILE = "/profile"
LOGIN_HISTORY = "/login-history"


@router.get(FAVORITE_TAGS)
async def get_favorite_tags_api(
    request: Request, user: UserDetails = Depends(get_current_user)
):
    return get_favorite_tags(request, user)


@router.post(FAVORITE_TAGS)
async def update_favorite_tags_api(
    request: Request,
    payload: AddFavoriteTags,
    user: UserDetails = Depends(get_current_user),
):
    return update_favorite_tags(request, user, payload.model_dump())


@router.get(PROFILE)
async def get_profile_api(
    request: Request, user: UserDetails = Depends(get_current_user)
):
    return get_profile(request, user)


@router.get(LOGIN_HISTORY)
async def get_login_history_api(
    request: Request, user: UserDetails = Depends(get_current_user)
):
    return get_login_history(request, user)


@router.put(PROFILE)
async def update_profile_api(
    request: Request,
    payload: UpdateProfile,
    user: UserDetails = Depends(get_current_user),
):
    return update_profile(request, user, payload.model_dump())
