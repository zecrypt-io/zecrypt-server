from app.utils.date_utils import create_timestamp
from app.utils.utils import create_uuid, response_helper, filter_payload
from app.managers import secrets as secrets_manager
from app.utils.constants import SECRET_TYPE_API_KEY

data_type = SECRET_TYPE_API_KEY


def get_api_key_details(db, doc_id):
    return response_helper(200, "API Key details loaded successfully", data=secrets_manager.find_one(db, {"doc_id": doc_id, "secret_type": data_type}, {"_id": False}))


def get_api_keys(db, request):
    query = {
        "secret_type": data_type,
        "project_id": request.path_params.get("project_id"),
    }

    api_keys = secrets_manager.find(db, query)

    return response_helper(200, "API Keys loaded successfully", data=api_keys, count=len(api_keys))


def add_api_key(request, user, payload, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    project_id = request.path_params.get("project_id")
    lower_title = payload.get("title").strip().lower()
    query = {
        "lower_title": lower_title,
        "created_by": user_id,
        "project_id": project_id,
        "secret_type": data_type,
    }

    api_key = secrets_manager.find_one(
        db,
        query,
    )
    if api_key:
        return response_helper(400, "API Key already exists")

    payload.update(
        {
            "doc_id": create_uuid(),
            "created_by": user_id,
            "lower_title": lower_title,
            "project_id": project_id,
            "secret_type": data_type,
        }
    )
    secrets_manager.insert_one(db, payload)

    return response_helper(201, "API Key added successfully", data=payload)


def update_api_key(request, user, payload, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    project_id = request.path_params.get("project_id")
    doc_id = request.path_params.get("doc_id")
    payload = filter_payload(payload)
    payload.update({"updated_at": create_timestamp(), "updated_by": user_id})

    # Process name if it exists in the payload
    if payload.get("title"):
        lower_title = payload["title"].strip().lower()
        payload["lower_title"] = lower_title

        existing_account = secrets_manager.find_one(
            db,
            {
                "project_id": project_id,
                "lower_title": lower_title,
                "doc_id": {"$ne": doc_id},
                "secret_type": data_type,
            },
        )
        if existing_account:
            return response_helper(400, "API Key already exists")

    # Update account
    secrets_manager.update_one(
        db,
        {"doc_id": doc_id},
        {"$set": payload},
    )

    return response_helper(200, "API Key updated successfully")


def delete_api_key(request, user, background_tasks):
    db = user.get("db")
    doc_id = request.path_params.get("doc_id")

    if not secrets_manager.find_one(db, {"doc_id": doc_id, "secret_type": data_type}):
        return response_helper(404, "API Key details not found")
    secrets_manager.delete_one(db, {"doc_id": doc_id, "secret_type": data_type})

    return response_helper(200, "API Key deleted successfully", data={})
