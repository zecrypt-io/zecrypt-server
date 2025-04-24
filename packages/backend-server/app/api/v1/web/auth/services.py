import requests
from user_agents import parse

from app.core.config import settings
from app.managers import login_activity as login_activity_manager
from app.utils.date_utils import create_timestamp


from app.api.v1.web.projects.services import create_project_at_signup
from app.managers import user as user_manager
from app.utils.jwt_utils import create_jwt_token
from app.utils.utils import (
    response_helper,
    id_generator,
)
from app.utils.jwt_utils import encode_token


def validate_stack_auth_token(token):
    endpoint = "https://api.stack-auth.com/api/v1/users/me"

    try:
        res = requests.request(
            "GET",
            endpoint,
            headers={
                "x-stack-access-type": "server",
                "x-stack-project-id": settings.STACK_AUTH_PROJECT_ID,
                "x-stack-publishable-client-key": settings.STACK_AUTH_CLIENT_ID,
                "x-stack-secret-server-key": settings.STACK_AUTH_CLIENT_SECRET,
                "x-stack-access-token": token,
            },
        )
        if res.status_code >= 400:
            return None
        return res.json()
    except Exception as e:
        print(f"Token validation failed: {e}")
        return None


def record_login_event(request, db, user):
    # Get IP Address
    client_ip = request.client.host
    if "x-forwarded-for" in request.headers:
        client_ip = request.headers["x-forwarded-for"].split(",")[0]

    user_agent = request.headers.get("user-agent")
    ua = parse(user_agent)
    data = {
        "ip_address": client_ip,
        "created_by": user.get("user_id"),
        "created_at": create_timestamp(),
        "user_agent": user_agent,
        "browser": ua.browser.family,
        "os": f"{ua.os.family} {ua.os.version_string}",
        "device": {
            "type": ua.device.family,
            "is_mobile": ua.is_mobile,
            "is_tablet": ua.is_tablet,
            "is_pc": ua.is_pc,
        },
    }
    login_activity_manager.insert_one(db, data)



def create_user(request, db,auth_data,response,back_ground_tasks):
    user_id = f"ZEC{id_generator(10)}"
    token = create_jwt_token({"user": user_id})

    new_user_data = {
        "uid": auth_data.get("id"),
        "name": auth_data.get("display_name"),
        "created_at": create_timestamp(),
        "updated_at": create_timestamp(),
        "email": auth_data.get("primary_email"),
        "user_id": user_id,
        "profile_url": auth_data.get("profile_image_url"),
        "token": token,
        "language": "en",
        "auth": {
            "has_password": auth_data.get("has_password"),
            "otp_auth_enabled": auth_data.get("otp_auth_enabled"),
            "auth_with_email": auth_data.get("auth_with_email"),
            "requires_totp_mfa": auth_data.get("requires_totp_mfa"),
            "passkey_auth_enabled": auth_data.get("passkey_auth_enabled"),
            "oauth_providers": auth_data.get("oauth_providers"),
        },
    }

    user_manager.insert_one(db, new_user_data)
    back_ground_tasks.add_task(create_project_at_signup, request, db, user_id)
    token_data = {
        "user_id": user_id,
        "profile_url": auth_data.get("profile_url"),
        "name": auth_data.get("display_name"),
        "access_token": token,
        "language": "en",
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

def user_login(request, db, user, response,back_ground_tasks):
    token = create_jwt_token({"user": user.get("user_id")})
    token_data = {
        "user_id": user.get("user_id"),
        "profile_url": user.get("profile_url"),
        "name": user.get("name"),
        "access_token": token,
        "language": user.get("language"),
    }

    user_manager.update_one(
        db,
        {"user_id": user.get("user_id")},
        {
            "$set": {
                "token": token,
                "last_login": create_timestamp(),
                "device_id": request.headers.get("device_id"),
            }
        },
    )
    back_ground_tasks.add_task(record_login_event, request, db, user)
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
