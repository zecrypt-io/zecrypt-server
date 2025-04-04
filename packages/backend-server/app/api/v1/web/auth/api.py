from fastapi import APIRouter, Request, BackgroundTasks

from app.api.v1.web.auth.schema import (
    Login,
    SignUp,
)
from app.api.v1.web.projects.services import create_project_at_signup
from app.framework.mongo_db.db import get_db
from app.managers import user as user_manager
from app.utils.date_utils import create_timestamp
from app.utils.jwt_utils import create_jwt_token
from app.utils.utils import (
    response_helper,
    id_generator,
)

db = get_db()
router = APIRouter()

LOGIN = "/login"
SIGNUP = "/signup"
PROFILE = "/profile"


@router.post(LOGIN)
async def login_api(
    request: Request, payload: Login, back_ground_tasks: BackgroundTasks
):
    payload = payload.model_dump()

    user = user_manager.find_one(db, {"uid": payload.get("uid")}, {"_id": False})

    if user and user.get("is_blocked"):
        return response_helper(
            status_code=400,
            message="Your account is blocked, Please contact Zecrypt team to resolve the issue. contact@zecrypt.io",
        )
    if not user:
        return response_helper(
            status_code=400,
            message="User not found, Please signup",
        )

    token = create_jwt_token({"user_id": user.get("user_id"), "role": user.get("role")})
    token_data = {
        "user_id": user.get("user_id"),
        "profile_url": user.get("profile_url"),
        "name": user.get("name"),
        "token": token,
    }

    user_manager.update_one(
        db,
        {"uid": payload.get("uid")},
        {
            "$set": {
                "token": token,
                "last_login": create_timestamp(),
                "device_id": payload.get("device_id"),
            }
        },
    )

    return response_helper(
        status_code=200, message="User logged in successfully", data=token_data
    )


@router.post(SIGNUP)
async def signup_api(
    request: Request, payload: SignUp, back_ground_tasks: BackgroundTasks
):
    payload = payload.model_dump()

    user = user_manager.find_one(db, {"uid": payload.get("uid")}, {"_id": False})

    if user:
        return response_helper(
            status_code=400,
            message="User already exists, Please login",
        )

    user_id = f"USR{id_generator(10)}"
    token = create_jwt_token({"user_id": user_id})
    new_user_data = {
        "uid": payload.get("uid"),
        "role": "user",
        "name": res.get("display_name"),
        "created_at": create_timestamp(),
        "updated_at": create_timestamp(),
        "email": payload.get("email"),
        "device_id": payload.get("device_id"),
        "user_id": user_id,
        "profile_url": res.get("profile_url"),
        "token": token,
        "user_name": None,
        "login_method": res.get("provider_id"),
        "is_blocked": False,
    }

    user_manager.insert_one(db, new_user_data)
    back_ground_tasks.add_task(create_project_at_signup,db, user_id)
    token_data = {
        "user_id": user_id,
        "profile_url": res.get("profile_url"),
        "name": res.get("display_name"),
        "token": token,
    }
    return response_helper(
        status_code=200, message="User signed up  successfully", data=token_data
    )
