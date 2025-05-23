from app.managers import workspace as workspace_manager
from app.managers import project as project_manager
from app.managers import secrets as secrets_manager
from app.utils.utils import response_helper
from app.utils.i8ns import translate


def create_initial_workspace_on_signup(db, request, user_id, workspace_id):
    workspace_manager.insert_one(
        db,
        {
            "created_by": user_id,
            "doc_id": workspace_id,
            "name": "Personal Workspace",
            "lower_name": "personal workspace",
        },
    )


def get_workspace(query, db):
    return response_helper(
        200,
        translate("workspace.details"),
        data=workspace_manager.find(db, query, {"_id": 0}),
        count=workspace_manager.count_documents(db, query),
    )


def load_initial_data(request, user):
    db = user.get("db")
    user_id = user.get("user_id")
    query = {
        "created_by": user_id,
    }
    workspaces = workspace_manager.find(db, query)

    return response_helper(
        200, translate("workspace.initial_data"), data=workspaces, count=len(workspaces)
    )


def get_tags(request, user):
    db = user.get("db")
    workspace_id = request.path_params.get("workspace_id")
    project_ids = project_manager.distinct(db, "doc_id", {"workspace_id": workspace_id})
    tags = secrets_manager.distinct(
        db, "tags", {"access": {"$ne": False}, "project_id": {"$in": project_ids}}
    )

    # Flatten all lists and get unique tags, removing null/None/empty values
    flat_tags = [
        tag
        for sublist in tags
        for tag in (sublist if isinstance(sublist, list) else [sublist])
    ]
    unique_tags = sorted(set(tag for tag in flat_tags if tag not in (None, "", [], {})))

    return response_helper(200, translate("workspace.tags"), data=unique_tags)
