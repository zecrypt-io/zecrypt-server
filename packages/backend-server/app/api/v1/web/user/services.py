from app.utils.utils import response_helper
from app.managers import favorite_tags as favorite_tags_manager
from app.managers import login_activity as login_activity_manager
from app.managers import user as user_manager

from app.utils.utils import filter_payload


def get_favorite_tags(request, user):
    tags = favorite_tags_manager.find_one(
        user.get("db"), {"created_by": user.get("user_id")}
    )

    return response_helper(200, "Favorite tags fetched successfully", data=tags)


def update_favorite_tags(request, user, payload):
    user_id = user.get("user_id")
    db = user.get("db")
    query = {"created_by": user_id}

    update_ops = {}
    if payload.get("tag_to_add"):
        update_ops["$push"] = {"tags": {"$each": payload["tag_to_add"]}}
    if payload.get("tag_to_remove"):
        update_ops["$pull"] = {"tags": {"$in": payload["tag_to_remove"]}}

    # Single atomic operation with upsert
    favorite_tags_manager.update_one(
        db, query, {**update_ops, "$setOnInsert": {"created_by": user_id}}, upsert=True
    )
    return response_helper(200, "Favorite tags updated successfully")


def get_profile(request, user):
    data = {
        "user_id": user.get("user_id"),
        "email": user.get("email"),
        "name": user.get("name"),
        "profile_url": user.get("profile_url"),
        "language": user.get("language", "en"),
    }
    return response_helper(200, "Profile fetched successfully", data=data)


def get_login_history(request, user):
    login_history = login_activity_manager.find(
        user.get("db"),
        {"created_by": user.get("user_id")},
        sort=[("created_at", -1)],
        skip=0,
        limit=10,
    )
    return response_helper(200, "Login history fetched successfully", data=login_history)


def update_profile(request, user, payload):
    payload = filter_payload(payload)

    if payload:
        query = {"user_id": user.get("user_id")}
        user_manager.update_one(user.get("db"), query, {"$set": payload})
        return response_helper(200, "Profile updated successfully")
    else:
        return response_helper(200, "No changes to update")
