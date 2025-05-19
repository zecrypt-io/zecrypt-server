from app.managers import audit_log as audit_log_manager
from app.managers.collection_names import (
    PROJECT,
    ACCOUNT,
    API_KEY,
    WALLET_PHRASE,
    WORKSPACE,
)
from app.utils.utils import create_uuid, response_helper


def get_audit_log_actions():
    """Return all possible audit log actions for each collection."""
    actions = ["created", "updated", "deleted"]
    collection_names = [PROJECT, ACCOUNT, API_KEY, WALLET_PHRASE, WORKSPACE]
    return [
        f"{collection}.{action}"
        for collection in collection_names
        for action in actions
    ]


def get_audit_logs(db, payload, request):
    """Fetch paginated audit logs for a workspace."""
    query = {"workspace_id": request.path_params.get("workspace_id")}
    sort = [("created_at", -1)]
    page = payload.get("page", 1)
    limit = payload.get("limit", 10)
    skip = (page - 1) * limit
    total = audit_log_manager.count_documents(db, query)
    data = audit_log_manager.find(db, query, sort=sort, skip=skip, limit=limit)
    return response_helper(
        200,
        "Audit logs fetched successfully",
        data=data,
        page=page,
        limit=limit,
        count=total,
    )


def get_audit_log_count(db, query):
    """Return the count of audit logs matching the query."""
    return audit_log_manager.count_documents(db, query)


def add_audit_log(db, collection_name, action, record_id, created_by, request=None):
    """Add a new audit log entry to the database."""
    audit_log = {
        "event": f"{collection_name}.{action}",
        "collection_name": collection_name,
        "action": action,
        "created_by": created_by,
        "record_id": record_id,
        "doc_id": create_uuid(),
        "ip_address": request.client.host if request else None,
        "user_agent": request.headers.get("User-Agent") if request else None,
        "workspace_id": request.path_params.get("workspace_id") if request else None,
        "project_id": request.path_params.get("project_id") if request else None,
    }
    audit_log_manager.insert_one(db, audit_log)
