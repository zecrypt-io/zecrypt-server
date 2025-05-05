from app.managers import secrets as secrets_manager
from app.utils.date_utils import create_timestamp
from app.utils.utils import response_helper, filter_payload, create_uuid

data_type="login"

def get_account_details(db, doc_id):
    return response_helper(
        status_code=200,
        message="Account details loaded successfully",
        data=secrets_manager.find_one(db, {"doc_id": doc_id,"secret_type":data_type}, {"_id": False}),
    )


def get_accounts(db, payload, request):
    page = payload.get("page", 1)
    limit = payload.get("limit", 20)
    tags = payload.get("tags", [])
    title = payload.get("title", None)
    project_id = request.path_params.get("project_id")

    query = {
        "project_id": project_id,"secret_type":data_type
    }
    if tags:
        query["tags"] = {"$in": tags}
    if title:
        query["lower_title"] =title.strip().lower() 

    skip = (page - 1) * limit
    sort = ("_id", 1)

    accounts = secrets_manager.find(
        db, query, sort=sort, skip=skip, limit=limit
    )

    return response_helper(
        status_code=200,
        message="Accounts loaded successfully",
        data=accounts,
        page=page,
        limit=limit,
        count=len(accounts),
    )


def add_account(request, user, payload, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    project_id = request.path_params.get("project_id")
    existing_account = secrets_manager.find_one(
        db,
        {
            "lower_title": payload.get("title").strip().lower(),
            "created_by": user_id,
            "project_id": project_id,
            "secret_type":data_type
        },
    )
    if existing_account:
        return response_helper(status_code=400, message="Account already exists")

    payload.update(
        {
            "doc_id": create_uuid(),
            "created_by": user_id,
            "lower_title": payload.get("title").strip().lower(),
            "project_id": project_id,
            "secret_type":data_type
        }
    )
    secrets_manager.insert_one(db, payload)

    return response_helper(
        status_code=201, message="Account added successfully", data={},
    )


def update_account(request, user, payload, background_tasks):
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
                "secret_type":data_type
            },
        )
        if existing_account:
            return response_helper(status_code=400, message="Account already exists")

    # Update account
    secrets_manager.update_one(
        db, {"doc_id": doc_id}, {"$set": payload,},
    )
    

def delete_account(request, user, background_tasks):
    db = user.get("db")
    doc_id = request.path_params.get("doc_id")

    if not secrets_manager.find_one(db, {"doc_id": doc_id,"secret_type":data_type}):
        return response_helper(status_code=404, message="Account details not found",)
    secrets_manager.delete_one(db, {"doc_id": doc_id,"secret_type":data_type})


    return response_helper(status_code=200, message="Account deleted successfully", data={},)
