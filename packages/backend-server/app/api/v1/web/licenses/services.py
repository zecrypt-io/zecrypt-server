from app.utils.date_utils import create_timestamp
from app.utils.utils import create_uuid, response_helper, filter_payload
from app.managers import secrets as secrets_manager
from app.utils.constants import SECRET_TYPE_LICENSE

data_type = SECRET_TYPE_LICENSE


def get_license_details(db, doc_id):
    return response_helper(
        status_code=200,
        message="License details loaded successfully",
        data=secrets_manager.find_one(
            db, {"doc_id": doc_id, "secret_type": data_type}, {"_id": False}
        ),
    )


def get_licenses(db, request):
    query = {
        "secret_type": data_type,
        "project_id": request.path_params.get("project_id"),
    }

    licenses = secrets_manager.find(db, query)

    return response_helper(
        status_code=200,
        message="Licenses loaded successfully",
        data=licenses,
        count=len(licenses),
    )


def add_license(request, user, payload, background_tasks):
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

    license = secrets_manager.find_one(db, query,)
    if license:
        return response_helper(
            status_code=400, message="License details with same title already exists"
        )

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
        status_code=201, message="License added successfully", data=payload,
    )


def update_license(request, user, payload, background_tasks):
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
            return response_helper(
                status_code=400,
                message="License details with same title already exists",
            )

    # Update account
    secrets_manager.update_one(
        db, {"doc_id": doc_id}, {"$set": payload},
    )

    return response_helper(
        status_code=200, message="License details updated successfully",
    )


def delete_license(request, user, background_tasks):
    db = user.get("db")
    doc_id = request.path_params.get("doc_id")

    if not secrets_manager.find_one(db, {"doc_id": doc_id, "secret_type": data_type}):
        return response_helper(status_code=404, message="License details not found",)

    secrets_manager.delete_one(db, {"doc_id": doc_id, "secret_type": data_type})

    return response_helper(
        status_code=200, message="License details deleted successfully", data={},
    )
