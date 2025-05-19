from fastapi import APIRouter, Request, BackgroundTasks, Response, Depends
from app.api.v1.web.auth.schema import Login, UserDetails, TwoFactorAuth, UpdateKeys
from app.api.v1.web.auth.services import validate_stack_auth_token
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.auth.services import (
    create_user,
    user_login,
    verify_two_factor_auth,
    get_keys,
    update_keys,
)
from app.framework.mongo_db.db import get_db
from app.managers import user as user_manager
from app.utils.utils import response_helper
from app.api.v1.web.route_constants import (
    LOGIN,
    LOGOUT,
    TWO_FACTOR_AUTH,
    GET_KEYS,
    UPDATE_KEYS,
)

db = get_db()
router = APIRouter()


@router.post(LOGIN)
async def login_api(
    request: Request,
    payload: Login,
    back_ground_tasks: BackgroundTasks,
    response: Response,
):
    payload = payload.model_dump()
    auth_data = validate_stack_auth_token(payload.get("uid"))
    if not auth_data:
        return response_helper(
            status_code=400,
            message="Authentication failed, Please try again",
        )
    user = user_manager.find_one(
        db, {"uid": auth_data.get("id"), "access": {"$ne": False}}, {"_id": False}
    )

    if not user:
        return create_user(request, db, auth_data, back_ground_tasks)

    return user_login(db, user)


@router.post(LOGOUT)
async def logout_api(
    request: Request, response: Response, user: UserDetails = Depends(get_current_user)
):
    user_manager.update_one(
        db, {"user_id": user.get("user_id")}, {"$set": {"token": None}}
    )
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    return response_helper(status_code=200, message="User logged out successfully")


# @router.post(TWO_FACTOR_AUTH, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
@router.post(TWO_FACTOR_AUTH)
async def two_factor_auth_api(
    request: Request,
    response: Response,
    payload: TwoFactorAuth,
    back_ground_tasks: BackgroundTasks,
):
    return verify_two_factor_auth(
        request, db, payload.model_dump(), response, back_ground_tasks
    )


@router.get(GET_KEYS)
async def get_keys_api(user: UserDetails = Depends(get_current_user)):
    return get_keys(db, user.get("user_id"))


@router.post(UPDATE_KEYS)
async def update_keys_api(
    request: Request, payload: UpdateKeys, user: UserDetails = Depends(get_current_user)
):
    return update_keys(db, user, payload.model_dump())
