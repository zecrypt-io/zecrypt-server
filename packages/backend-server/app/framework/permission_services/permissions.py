import jwt
from fastapi import HTTPException
from fastapi import Header, Response
from pydantic import ValidationError

from app.core.config import settings
from app.framework.mongo_db.db import get_db
from app.repository import user_details as user_repo
from app.utils.localization.service import translation as _
from app.utils.logger.service import get_logger

logger = get_logger("Security")

jwt_secret = settings.JWT_SECRET
jwt_algo = settings.JWT_ALGORITHM


def get_current_user(response: Response, token: str = Header(...)):
    if not token:
        raise HTTPException(status_code=401, detail="invalid_header")
    user_id = None
    try:
        user_id = jwt.decode(
            token,
            jwt_secret,
            algorithms=[str(jwt_algo)],
        ).get("user")
    except ValidationError:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="invalid_token")
    except jwt.ExpiredSignatureError:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="new_token_required")
    except jwt.PyJWTError:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="Unable to decode JWT token")

    user = user_repo.redis_find_one({"user_id": user_id})
    if not user:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=404, detail="User details not found")
    if not user.get("user_access"):
        response.delete_cookie("refresh_token")
        raise HTTPException(
            status_code=400, detail="You are not authorized to perform this action"
        )
    # adding customer db to user object
    user["company_db"] = get_db(user.get("company_id"))
    if user.get("allow_multiple_sessions"):
        return user
    elif token == user.get("token"):
        return user
    else:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="session_expired")


def check_if_authenticated_admin(response: Response, token: str = Header(...)):
    if not token:
        raise HTTPException(status_code=400, detail=_("invalid_header"))
    user_id = None
    try:
        user_id = jwt.decode(
            token,
            jwt_secret,
            algorithms=[str(jwt_algo)],
        ).get("user")
    except ValidationError:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="invalid_token")
    except jwt.ExpiredSignatureError:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="new_token_required")
    except jwt.PyJWTError:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="Unable to decode JWT token")

    user = user_repo.redis_find_one({"user_id": user_id})
    if not user:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=404, detail="User details not found")
    if not user.get("user_access") or user.get("user_role") != "admin":
        response.delete_cookie("refresh_token")
        raise HTTPException(
            status_code=400, detail="You are not authorized to perform this action"
        )
    user["company_db"] = get_db(user.get("company_id"))
    if user.get("allow_multiple_sessions"):
        return user
    elif token == user.get("token"):
        return user
    else:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="session_expired")


def is_masked(user_id):
    user = user_repo.redis_find_one({"user_id": user_id})
    return user.get("is_masked", True)


def check_if_admin_user(user_id):
    user = user_repo.redis_find_one({"user_id": user_id})
    if user:
        return user["user_role"] == "admin"
    else:
        raise HTTPException(status_code=404, detail=_("User details not found"))
