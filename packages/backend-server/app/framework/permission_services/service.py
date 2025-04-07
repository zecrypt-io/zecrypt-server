import jwt
from fastapi import Header, HTTPException, Response
from pydantic import ValidationError
from typing import Dict, Any, Optional

from app.core.config import settings
from app.framework.mongo_db.db import get_db
from app.managers import user as user_manager

jwt_secret = settings.JWT_SECRET
jwt_algo = settings.JWT_ALGORITHM


def _handle_auth_error(
    response: Response, message: str, status_code: int = 401
) -> None:
    """Helper function to handle authentication errors consistently"""
    response.delete_cookie("refresh_token")
    raise HTTPException(status_code=status_code, detail=message)


def get_current_user(response: Response, token: str = Header(...)) -> Dict[str, Any]:
    """
    Validate JWT token and return the current user

    Args:
        response: FastAPI response object for cookie management
        token: JWT token from request header

    Returns:
        User object with database connection

    Raises:
        HTTPException: For any authentication or user lookup failures
    """
    if not token:
        raise HTTPException(status_code=401, detail="invalid_header")

    try:
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=[str(jwt_algo)],
        )
        user_id = payload.get("user")
        if not user_id:
            _handle_auth_error(response, "Invalid token payload")

    except jwt.ExpiredSignatureError:
        _handle_auth_error(response, "Session Expired, Please login Again")
    except (jwt.PyJWTError, ValidationError):
        _handle_auth_error(response, "Invalid Token, Please login Again")

    # Get DB connection only when needed
    db = get_db()
    user = user_manager.find(db, {"user_id": user_id})

    if not user:
        _handle_auth_error(response, "User details not found", 404)

    if token != user.get("token"):
        _handle_auth_error(response, "Session Expired, Please login Again")

    # Add DB to user object for downstream operations
    user["db"] = db
    return user
