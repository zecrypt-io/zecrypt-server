import jwt
from fastapi import Header, HTTPException, Response
from pydantic import ValidationError
from typing import Dict, Any, Optional

from app.core.config import settings
from app.framework.mongo_db.db import get_db
from app.managers import user as user_manager

jwt_secret = settings.JWT_SECRET
jwt_algo = settings.JWT_ALGORITHM
db=get_db()

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

    user = user_manager.find_one(db, {"user_id": user_id})
    if not user:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=404, detail="User details not found")
    
    # adding customer db to user object
    user["db"] = get_db()
    return user