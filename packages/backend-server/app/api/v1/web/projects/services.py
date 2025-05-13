from app.utils.date_utils import create_timestamp
from app.utils.utils import create_uuid, response_helper, filter_payload
from app.managers import (
    project as project_manager,
    project_keys as project_keys_manager,
    secrets as secrets_manager,
)

from app.framework.encryption.service import get_project_key


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


def add_project(request, user, payload, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    workspace_id = request.path_params.get("workspace_id")
    project = project_manager.find_one(
        db,
        {
            "workspace_id": workspace_id,
            "lower_name": payload.get("name").strip().lower(),
            "created_by": user_id,
        },
    )
    if project:
        return response_helper(status_code=400, message="Project already exists")

    payload.update(
        {
            "doc_id": create_uuid(),
            "created_by": user_id,
            "lower_name": payload.get("name").strip().lower(),
            "workspace_id": workspace_id,
        }
    )
    project_manager.insert_one(db, payload)
    add_project_key(db, user_id, payload.get("doc_id"), workspace_id)
    return response_helper(
        status_code=201,
        message="Project added successfully",
        data=payload,
    )


def update_project(request, user, payload, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    workspace_id = request.path_params.get("workspace_id")
    doc_id = request.path_params.get("doc_id")
    payload = filter_payload(payload)
    payload.update({"updated_by": user_id, "updated_at": create_timestamp()})

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

    # Update project
    project_details = project_manager.find_one_and_update(
        db, {"doc_id": doc_id}, {"$set": payload}
    )

    if payload.get("is_default"):
        project_manager.update_many(
            db,
            {"workspace_id": workspace_id, "doc_id": {"$ne": doc_id}},
            {"$set": {"is_default": False}},
        )

    return response_helper(
        status_code=200, message="Project updated successfully", data=project_details
    )


def delete_project(request, user, background_tasks):
    db = user.get("db")
    doc_id = request.path_params.get("doc_id")
    if not project_manager.find_one(db, {"doc_id": doc_id}):
        return response_helper(
            status_code=404,
            message="Project details not found",
        )

    project_manager.delete_one(db, {"doc_id": doc_id})

    return response_helper(
        status_code=200,
        message="Project deleted successfully",
        data={},
    )


def get_tags(db, project_id):
    tags = secrets_manager.distinct(db, "tags", {"project_id": project_id})
    # Flatten all lists and get unique tags, removing null/None/empty values
    flat_tags = [
        tag
        for sublist in tags
        for tag in (sublist if isinstance(sublist, list) else [sublist])
    ]
    unique_tags = sorted(set(tag for tag in flat_tags if tag not in (None, "", [], {})))

    return response_helper(
        status_code=200, message="Tags loaded successfully", data=unique_tags
    )


def add_project_key(db, user_id, project_id, workspace_id):
    project_key = get_project_key(db, user_id)
    project_keys_manager.insert_one(
        db,
        {
            "doc_id": create_uuid(),
            "project_id": project_id,
            "user_id": user_id,
            "project_key": project_key,
            "workspace_id": workspace_id,
        },
    )


def get_project_keys(request, db, user_id):
    project_keys = project_keys_manager.find(
        db,
        {"user_id": user_id, "workspace_id": request.path_params.get("workspace_id")},
    )
    return response_helper(
        status_code=200, message="Project keys loaded successfully", data=project_keys
    )
