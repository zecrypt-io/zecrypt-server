from app.managers import accounts as accounts_manager
from app.managers.collection_names import ACCOUNT
from app.utils.date_utils import create_timestamp
from app.utils.utils import response_helper, filter_payload, create_uuid
from app.api.v1.web.audit_logs.services import add_audit_log

def get_account_details(db, doc_id):
    return response_helper(
        status_code=200,
        message="Account details loaded successfully",
        data=accounts_manager.find_one(db, {"doc_id": doc_id}, {"_id": False}),
    )


def get_accounts(db, query, sort=None, projection=None, page=1, limit=20):
    skip = (page - 1) * limit
    if not sort:
        sort = ("_id", 1)

    accounts = accounts_manager.find(
        db, query, projection, sort=sort, skip=skip, limit=limit
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
    existing_account = accounts_manager.find_one(
        db,
        {
            "lower_name": payload.get("name").strip().lower(),
            "created_by": user_id,
            "project_id": project_id,
        },
    )
    if existing_account:
        return response_helper(status_code=400, message="Account already exists")

    timestamp = create_timestamp()
    payload.update(
        {
            "doc_id": create_uuid(),
            "created_by": user_id,
            "lower_name": payload.get("name").strip().lower(),
            "created_at": timestamp,
            "updated_at": timestamp,
            "project_id": project_id,
        }
    )
    accounts_manager.insert_one(db, payload)
    background_tasks.add_task(
        add_audit_log,
        db,
        ACCOUNT,
        "created",
        payload.get("doc_id"),
        payload.get("created_by"),
        request,
    )
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
    if payload.get("name"):
        lower_name = payload["name"].strip().lower()
        payload["lower_name"] = lower_name

        existing_account = accounts_manager.find_one(
            db,
            {
                "project_id": project_id,
                "lower_name": lower_name,
                "doc_id": {"$ne": doc_id},
            },
        )
        if existing_account:
            return response_helper(status_code=400, message="Account already exists")

    # Update account
    accounts_manager.update_one(
        db, {"doc_id": doc_id}, {"$set": payload,},
    )
    
    # Add audit log
    background_tasks.add_task(
        add_audit_log,
        db,
        ACCOUNT,
        "updated",
        doc_id,
        user_id,
        request,
    )


def delete_account(request, user, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    doc_id = request.path_params.get("doc_id")

    if not accounts_manager.find_one(db, {"doc_id": doc_id}):
        return response_helper(status_code=404, message="Account details not found",)
    accounts_manager.delete_one(db, {"doc_id": doc_id})

    # Add audit log
    background_tasks.add_task(
        add_audit_log,
        db,
        ACCOUNT,
        "deleted",
        doc_id,
        user_id,
        request,
    )
    return response_helper(status_code=200, message="Account deleted successfully", data={},)
