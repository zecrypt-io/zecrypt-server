from app.managers import audit_log as audit_log_manager
from app.managers.collection_names import PROJECT, ACCOUNT, API_KEY, WALLET_PHRASE, WORKSPACE
from app.utils.utils import create_uuid
from app.utils.date_utils import create_timestamp

def get_aduit_log_actions():
    actions = ["created", "updated", "deleted"]
    collection_names = [PROJECT, ACCOUNT, API_KEY, WALLET_PHRASE, WORKSPACE]
    return [f"{collection}.{action}" for collection in collection_names for action in actions]
           


def get_audit_logs(db, query, sort=None, skip=0, limit=20):
    return audit_log_manager.find(db, query, sort=sort, skip=skip, limit=limit)


def get_audit_log_count(db, query):
    return audit_log_manager.count_documents(db, query)



def add_audit_log(db, collection_name, action, record_id, created_by, request=None):
    audit_log = {
        "event":f"{collection_name}.{action}",
        "collection_name": collection_name,
        "action": action,
        "created_at": create_timestamp(),
        "created_by": created_by,
        "record_id": record_id,
        "doc_id": create_uuid(),
        "message": f"{collection_name.title().replace('_', ' ')} is {action}.",
        "ip_address": request.client.host if request else None,
        "user_agent": request.headers.get('User-Agent') if request else None,
        "workspace_id": request.path_params.get('workspace_id') if request else None,
        "project_id": request.path_params.get('project_id') if request else None
    }
    audit_log_manager.insert_one(db, audit_log)