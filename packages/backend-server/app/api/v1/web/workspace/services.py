from app.managers import workspace as workspace_manager
from app.managers import project as project_manager
from app.managers import accounts as account_manager
from app.managers import api_keys as api_key_manager
from app.managers import wallet_phrase as wallet_phrase_manager
from app.utils.date_utils import create_timestamp
from app.utils.utils import response_helper
from app.api.v1.web.audit_logs.services import add_audit_log

def create_initial_workspace_on_signup(db,request, user_id, workspace_id):
    timestamp = create_timestamp()
    workspace_manager.insert_one(
        db,
        {
            "created_by": user_id,
            "doc_id": workspace_id,
            "name": "Personal Workspace",
            "created_at": timestamp,
            "updated_at": timestamp,
        },
    )


def get_workspace(query, db):
    return response_helper(
        status_code=200,
        message="Workspace details loaded successfully",
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

    for workspace in workspaces:
        projects = project_manager.find(db, {"workspace_id": workspace.get("doc_id")})
        workspace["projects"] = projects

    return response_helper(
        status_code=200,
        message="Initial data loaded successfully",
        data=workspaces,
        count=len(workspaces),
    )

def get_tags(request, user):   
    db = user.get("db")
    workspace_id = request.path_params.get("workspace_id")
    project_ids = project_manager.distinct(db, "doc_id", {"workspace_id": workspace_id})
    account_tags = account_manager.distinct(db, "tags", {"access": {"$ne":False}, "project_id": {"$in": project_ids}})
    api_key_tags = api_key_manager.distinct(db, "tags", {"access": {"$ne":False}, "project_id": {"$in": project_ids}})
    wallet_phrase_tags = wallet_phrase_manager.distinct(db, "tags", {"access": {"$ne":False}, "project_id": {"$in": project_ids}})

    # Flatten all lists and get unique tags, removing null/None/empty values
    all_tags = account_tags + api_key_tags + wallet_phrase_tags
    flat_tags = [tag for sublist in all_tags for tag in (sublist if isinstance(sublist, list) else [sublist])]
    unique_tags = sorted(set(tag for tag in flat_tags if tag not in (None, '', [], {})))

    return response_helper(status_code=200, message="Tags loaded successfully", data=unique_tags,)