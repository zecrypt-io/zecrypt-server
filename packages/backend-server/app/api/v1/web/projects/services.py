from app.utils.date_utils import create_timestamp
from app.utils.utils import create_uuid, response_helper, filter_payload
from app.managers import project as project_manager
from app.managers import workspace as workspace_manager


def create_project_at_signup(db, user_id):
    workspace_id = create_uuid()
    timestamp = create_timestamp()
    workspace_manager.insert_one(
        db,
        {
            "created_by": user_id,
            "workspace_id": workspace_id,
            "name": "Personal Workspace",
            "created_at": timestamp,
            "updated_at": timestamp,
        },
    )
    data = {
        "created_by": user_id,
        "name": "Primary Vault",
        "lower_name": "primary vault",
        "created_at": timestamp,
        "updated_at": timestamp,
        "is_default": True,
        "doc_id": create_uuid(),
        "workspace_id": workspace_id,
    }
    project_manager.insert_one(db, data)


def get_project_details(db, doc_id):
    return response_helper(
        status_code=200,
        message="Project details loaded successfully",
        data=project_manager.find_one(db, {"doc_id": doc_id}, {"_id": False}),
    )


def get_projects(db, query, sort=None, projection=None, page=1, limit=20):
    skip = (page - 1) * limit
    if not sort:
        sort = ("_id", 1)

    projects = project_manager.find(
        db, query, projection, sort=sort, skip=skip, limit=limit
    )

    return response_helper(
        status_code=200,
        message="Projects loaded successfully",
        data=projects,
        page=page,
        limit=limit,
        count=len(projects),
    )


def add_project(user, payload, workspace_id):
    db = user.get("db")
    project = project_manager.find_one(
        db,
        {
            "workspace_id": workspace_id,
            "lower_name": payload.get("lower_name").strip().lower(),
            "created_by": user.get("user_id"),
        },
    )
    if project:
        return response_helper(status_code=400, message="Project already exists")

    timestamp = create_timestamp()
    payload.update(
        {
            "doc_id": create_uuid(),
            "updated_by": user.get("user_id"),
            "lower_name": payload.get("name").strip().lower(),
            "created_at": timestamp,
            "updated_at": timestamp,
        }
    )
    project_manager.insert_one(db, payload)

    return response_helper(
        status_code=201, message="Project added successfully", data=payload,
    )


def update_project(user, workspace_id, doc_id, payload):
    db = user.get("db")
    payload = filter_payload(payload)
    payload.update({"updated_by": user.get("user_id"), "updated_at": create_timestamp()})
    # Process name if it exists in the payload
    if payload.get("name"):
        lower_name = payload["name"].strip().lower()
        payload["lower_name"] = lower_name

        existing_project = project_manager.find_one(
            db,
            {
                "workspace_id": workspace_id,
                "lower_name": lower_name,
                "doc_id": {"$ne": doc_id},
            },
        )
        if existing_project:
            return response_helper(status_code=400, message="project already exists")
    # Update account
    project_manager.update_one(
        db, {"doc_id": doc_id}, {"$set": payload},
    )
    return response_helper(status_code=200, message="Project updated successfully",)


def delete_project(user, workspace_id, doc_id):
    db = user.get("db")
    if not project_manager.find_one(db, {"doc_id": doc_id}):
        return response_helper(status_code=404, message="Project details not found",)
    project_manager.delete_one(db, {"doc_id": doc_id})
    return response_helper(
        status_code=200, message="Project deleted successfully", data={},
    )
