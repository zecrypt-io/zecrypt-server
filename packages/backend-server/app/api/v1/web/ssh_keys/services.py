from app.utils.date_utils import create_timestamp
from app.utils.utils import create_uuid, response_helper, filter_payload
from app.managers import secrets as secrets_manager
from app.utils.constants import SECRET_TYPE_SSH_KEY

data_type = SECRET_TYPE_SSH_KEY


def get_ssh_key_details(db, doc_id):
    return response_helper(
        status_code=200,
        message="SSH Key details loaded successfully",
        data=secrets_manager.find_one(
            db, {"doc_id": doc_id, "secret_type": data_type}, {"_id": False}
        ),
    )


def get_ssh_keys(db, request):
    query = {
        "secret_type": data_type,
        "project_id": request.path_params.get("project_id"),
    }

    ssh_keys = secrets_manager.find(db, query)

    return response_helper(
        status_code=200,
        message="SSH Keys loaded successfully",
        data=ssh_keys,
        count=len(ssh_keys),
    )


def add_ssh_key(request, user, payload, background_tasks):
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

    ssh_key = secrets_manager.find_one(
        db,
        query,
    )
    if ssh_key:
        return response_helper(status_code=400, message="SSH Key already exists")

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

    return response_helper(
        status_code=201,
        message="API Key added successfully",
        data=payload,
    )


def update_ssh_key(request, user, payload, background_tasks):
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
            return response_helper(status_code=400, message="SSH Key already exists")

    # Update account
    secrets_manager.update_one(
        db,
        {"doc_id": doc_id},
        {"$set": payload},
    )

    return response_helper(
        status_code=200,
        message="SSH Key updated successfully",
    )


def delete_ssh_key(request, user, background_tasks):
    db = user.get("db")
    doc_id = request.path_params.get("doc_id")

    if not secrets_manager.find_one(db, {"doc_id": doc_id, "secret_type": data_type}):
        return response_helper(
            status_code=404,
            message="SSH Key details not found",
        )
    secrets_manager.delete_one(db, {"doc_id": doc_id, "secret_type": data_type})

    return response_helper(
        status_code=200,
        message="SSH Key deleted successfully",
        data={},
    )
