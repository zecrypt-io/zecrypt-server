from app.utils.date_utils import create_timestamp
from app.utils.utils import create_uuid, response_helper, filter_payload
from app.managers import secrets as secrets_manager
from app.utils.constants import SECRET_TYPE_WALLET_PHRASE

data_type = SECRET_TYPE_WALLET_PHRASE


def get_wallet_phrase_details(db, doc_id):
    return response_helper(
        status_code=200,
        message="Wallet phrase details loaded successfully",
        data=secrets_manager.find_one(
            db, {"doc_id": doc_id, "secret_type": data_type}, {"_id": False}
        ),
    )


def get_wallet_phrases(db, payload, request):
    # Destructure pagination parameters with defaults
    page = int(payload.get("page", 1))
    limit = int(payload.get("limit", 20))
    sort_by = payload.get("sort_by", "created_at")
    sort_order = payload.get("sort_order", "asc")
    project_id = request.path_params.get("project_id")

    # Build query with optional filters
    query = {
        "project_id": project_id,
        "secret_type": data_type,
        **({"tags": {"$in": payload["tags"]}} if payload.get("tags") else {}),
        **(
            {"lower_title": payload["title"].strip().lower()}
            if payload.get("title")
            else {}
        ),
        **(
            {"wallet_type": payload["wallet_type"]}
            if payload.get("wallet_type")
            else {}
        ),
    }

    # Calculate skip and sort options
    skip = (page - 1) * limit
    sort = (sort_by, 1 if sort_order == "asc" else -1)

    # Execute query
    data = secrets_manager.find(db, query, sort=sort, skip=skip, limit=limit)

    # Return paginated response
    return response_helper(
        status_code=200,
        message="Wallet phrases loaded successfully",
        data=data,
        page=page,
        limit=limit,
        count=len(data),
    )


def add_wallet_phrase(request, user, payload, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    project_id = request.path_params.get("project_id")
    wallet_phrase = secrets_manager.find_one(
        db,
        {
            "lower_title": payload.get("title").strip().lower(),
            "created_by": user_id,
            "project_id": project_id,
            "secret_type": data_type,
        },
    )
    if wallet_phrase:
        return response_helper(status_code=400, message="Wallet phrase already exists")

    payload.update(
        {
            "doc_id": create_uuid(),
            "created_by": user_id,
            "lower_title": payload.get("title").strip().lower(),
            "project_id": project_id,
            "secret_type": data_type,
        }
    )
    secrets_manager.insert_one(db, payload)

    return response_helper(
        status_code=201, message="Wallet phrase added successfully", data=payload
    )


def update_wallet_phrase(request, user, payload, background_tasks):
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

        existing_wallet_phrase = secrets_manager.find_one(
            db,
            {
                "project_id": project_id,
                "lower_title": lower_title,
                "doc_id": {"$ne": doc_id},
                "secret_type": data_type,
            },
        )
        if existing_wallet_phrase:
            return response_helper(
                status_code=400, message="Wallet phrase already exists"
            )
    # Update wallet phrase
    secrets_manager.update_one(
        db,
        {"doc_id": doc_id},
        {
            "$set": payload,
        },
    )

    return response_helper(
        status_code=200,
        message="Wallet phrase updated successfully",
        data=payload,
    )


def delete_wallet_phrase(request, user, background_tasks):
    db = user.get("db")
    doc_id = request.path_params.get("doc_id")
    if not secrets_manager.find_one(db, {"doc_id": doc_id, "secret_type": data_type}):
        return response_helper(
            status_code=404,
            message="Wallet phrase details not found",
        )
    secrets_manager.delete_one(db, {"doc_id": doc_id, "secret_type": data_type})
    return response_helper(
        status_code=200,
        message="Wallet phrase deleted successfully",
        data={},
    )
