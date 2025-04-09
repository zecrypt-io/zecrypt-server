from fastapi import APIRouter, Request, BackgroundTasks, Response, Depends

from app.api.v1.web.auth.schema import (
    Login,
    SignUp,
    UserDetails,
)
from app.api.v1.web.auth.services import (
    validate_stack_auth_token,
    record_login_event,
)
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.projects.services import create_project_at_signup
from app.framework.mongo_db.db import get_db
from app.managers import user as user_manager
from app.utils.date_utils import create_timestamp
from app.utils.jwt_utils import create_jwt_token
from app.utils.utils import (
    response_helper,
    id_generator,
)
from app.utils.jwt_utils import encode_token

db = get_db()
router = APIRouter()

LOGIN = "/login"
SIGNUP = "/signup"
LOGOUT = "/logout"


@router.post(LOGIN)
async def login_api(
    request: Request,
    payload: Login,
    back_ground_tasks: BackgroundTasks,
    response: Response,
):
    payload = payload.model_dump()
    res = validate_stack_auth_token(payload.get("uid"))
    if not res:
        return response_helper(
            status_code=400, message="Authentication failed, Please try again",
        )
    print(res)
    user = user_manager.find_one(db, {"uid": res.get("id")}, {"_id": False})
    print(user)
    if not user:
        return response_helper(
            status_code=400, message="User not found, Please signup",
        )

    token = create_jwt_token({"user": user.get("user_id")})
    token_data = {
        "user_id": user.get("user_id"),
        "profile_url": user.get("profile_url"),
        "name": user.get("name"),
        "access_token": token,
    }

    user_manager.update_one(
        db,
        {"uid": res.get("id")},
        {
            "$set": {
                "token": token,
                "last_login": create_timestamp(),
                "device_id": payload.get("device_id"),
            }
        },
    )
    back_ground_tasks.add_task(record_login_event, request, db, user.get("user_id"))
    refresh_token = encode_token(user.get("user_id"))
    response.set_cookie(
        key="access_token", value=token, httponly=True, secure=True, samesite="strict"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
    )
    return response_helper(
        status_code=200, message="User logged in successfully", data=token_data
    )


@router.post(SIGNUP)
async def signup_api(
    request: Request,
    payload: SignUp,
    back_ground_tasks: BackgroundTasks,
    response: Response,
):
    payload = payload.model_dump()
    res = validate_stack_auth_token(payload.get("uid"))
    if not res:
        return response_helper(
            status_code=400, message="Authentication failed, Please try again",
        )

    user = user_manager.find_one(db, {"uid": res.get("id")}, {"_id": False})

    if user:
        return response_helper(
            status_code=400, message="User already exists, Please login",
        )

    user_id = f"ZEC{id_generator(10)}"
    token = create_jwt_token({"user": user_id})

    new_user_data = {
        "uid": res.get("id"),
        "name": res.get("display_name"),
        "created_at": create_timestamp(),
        "updated_at": create_timestamp(),
        "email": payload.get("primary_email"),
        "user_id": user_id,
        "profile_url": res.get("profile_image_url"),
        "token": token,
        "auth": {
            "has_password": res.get("has_password"),
            "otp_auth_enabled": res.get("otp_auth_enabled"),
            "auth_with_email": res.get("auth_with_email"),
            "requires_totp_mfa": res.get("requires_totp_mfa"),
            "passkey_auth_enabled": res.get("passkey_auth_enabled"),
            "oauth_providers": res.get("oauth_providers"),
        },
    }

    user_manager.insert_one(db, new_user_data)
    back_ground_tasks.add_task(create_project_at_signup, request, db, user_id)
    token_data = {
        "user_id": user_id,
        "profile_url": res.get("profile_url"),
        "name": res.get("display_name"),
        "access_token": token,
    }
    refresh_token = encode_token(user_id)
    response.set_cookie(
        key="access_token", value=token, httponly=True, secure=True, samesite="strict"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
    )
    return response_helper(
        status_code=200, message="User signed up successfully", data=token_data
    )


@router.post(LOGOUT)
async def logout_api(
    request: Request, response: Response, user: UserDetails = Depends(get_current_user)
):
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    return response_helper(status_code=200, message="User logged out successfully")
