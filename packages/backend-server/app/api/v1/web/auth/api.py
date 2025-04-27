from fastapi import APIRouter, Request, BackgroundTasks, Response, Depends

from app.api.v1.web.auth.schema import (
    Login,
    UserDetails,
)
from app.api.v1.web.auth.services import (
    validate_stack_auth_token,
)
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.auth.services import create_user, user_login
from app.framework.mongo_db.db import get_db
from app.managers import user as user_manager
from app.utils.utils import (
    response_helper,
)

db = get_db()
router = APIRouter()

LOGIN = "/login"
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
    user = user_manager.find_one(db, {"uid": res.get("id"),"access":{"$ne":False}}, {"_id": False})
    
    if not user:
        return create_user(request, db, res, response, back_ground_tasks)

    return user_login(request, db, user, response, back_ground_tasks)


@router.post(LOGOUT)
async def logout_api(
    request: Request, response: Response, user: UserDetails = Depends(get_current_user)
):
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    return response_helper(status_code=200, message="User logged out successfully")
