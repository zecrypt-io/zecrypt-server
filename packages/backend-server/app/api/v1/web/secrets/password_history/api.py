from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.secrets.password_history.schema import AddPasswordHistory

from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.managers import password_history as password_history_manager
from app.api.v1.web.route_constants import  PASSWORD_HISTORY
from app.utils.utils import create_uuid, response_helper, filter_payload
from app.utils.i8ns import translate
from app.utils.date_utils import create_timestamp

router = APIRouter()


@router.get(PASSWORD_HISTORY)
async def get_password_history_api(
    request: Request,
    user: UserDetails = Depends(get_current_user),

):
    db = user.get("db")
    password_history = password_history_manager.find(db, {},sort=[("created_at", -1)], skip=0, limit=20)
    return response_helper(200, translate("password_history.list"), data=password_history)


@router.post(PASSWORD_HISTORY)
async def create_password_history_api(
    request: Request,
    payload: AddPasswordHistory,
    user: UserDetails = Depends(get_current_user),
):
    db = user.get("db")
    payload = filter_payload(payload.model_dump())
    payload.update({
        "doc_id": create_uuid(),
        "created_by": user.get("user_id"),
        "created_at": create_timestamp(),
    })
    password_history_manager.insert_one(db, payload)
    return response_helper(200, translate("password_history.add"))
