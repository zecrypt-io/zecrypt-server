from app.utils.date_utils import create_timestamp
from app.utils.utils import create_uuid, response_helper, filter_payload
from app.managers import secrets as secrets_manager

data_type = "license"


def get_license_details(db, doc_id):
    return response_helper(
        status_code=200,
        message="License details loaded successfully",
        data=secrets_manager.find_one(
            db, {"doc_id": doc_id, "secret_type": data_type}, {"_id": False}
        ),
    )


def get_licenses(db, payload, request):
    page = payload.get("page", 1)
    limit = payload.get("limit", 20)
    tags = payload.get("tags", [])
    title = payload.get("title", None)
    project_id = request.path_params.get("project_id")
    sort_by = payload.get("sort_by", "created_at")
    sort_order = payload.get("sort_order", "asc")
    query = {
        "secret_type": data_type,
        "project_id": project_id,
        **({"tags": {"$in": tags}} if tags else {}),
        **({"lower_title": title.strip().lower()} if title else {}),
    }

    sort = (sort_by, 1 if sort_order == "asc" else -1) 
    skip = (page - 1) * limit

    licenses = secrets_manager.find(db, query, sort=sort, skip=skip, limit=limit)

    return response_helper(
        status_code=200,
        message="Licenses loaded successfully",
        data=licenses,
        page=page,
        limit=limit,
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

    license = secrets_manager.find_one(
        db,
        query,
    )
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
        status_code=201,
        message="License added successfully",
        data=payload,
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
        db,
        {"doc_id": doc_id},
        {"$set": payload},
    )

    return response_helper(
        status_code=200,
        message="License details updated successfully",
    )


def delete_license(request, user, background_tasks):
    db = user.get("db")
    doc_id = request.path_params.get("doc_id")

    if not secrets_manager.find_one(db, {"doc_id": doc_id, "secret_type": data_type}):
        return response_helper(
            status_code=404,
            message="License details not found",
        )

    secrets_manager.delete_one(db, {"doc_id": doc_id, "secret_type": data_type})

    return response_helper(
        status_code=200,
        message="License details deleted successfully",
        data={},
    )
