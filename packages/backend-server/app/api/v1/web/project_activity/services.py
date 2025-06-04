from app.utils.date_utils import create_timestamp
from app.utils.utils import create_uuid
from app.managers import project_activity as project_activity_manager


def add_recent_activity(user, project_id, data_type, record_id, action):
    db = user.get("db")
    project_activity_manager.insert_one(
        db,
        {
            "doc_id": create_uuid(),
            "project_id": project_id,
            "data_type": data_type,
            "user_id": user.get("user_id"),
            "record_id": record_id,
            "action": action,
            "created_at": create_timestamp(),
        },
    )
