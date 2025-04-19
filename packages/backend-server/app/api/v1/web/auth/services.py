import requests
from user_agents import parse

from app.core.config import settings
from app.managers import login_activity as login_activity_manager
from app.utils.date_utils import create_timestamp


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



