from app.utils.date_utils import create_timestamp
from app.utils.utils import create_uuid, response_helper, filter_payload
from app.managers import secrets as secrets_manager
from app.utils.i8ns import translate
from app.api.v1.web.project_activity.services import add_recent_activity
# from app.framework.valkey import services as valkey_services


async def get_secrets(request, user, data_type):
    db = user.get("db")
    page = request.query_params.get("page", None)
    limit = request.query_params.get("limit", None)
    project_id = request.path_params.get("project_id")
    query = {
        "secret_type": data_type,
        "project_id": project_id,
    }
    # if valkey_services.check_secret_exists(project_id, data_type, query):
    #     data = valkey_services.get_secret(project_id, data_type, query)
    #     return response_helper(
    #         200, translate(f"{data_type}.list"), data=data, count=len(data)
    #     )

    if page and limit:
        skip = (page - 1) * limit
        secrets = secrets_manager.find(db, query, skip=skip, limit=limit)
    else:
        secrets = secrets_manager.find(db, query)

    return response_helper(
        200, translate(f"{data_type}.list"), data=secrets, count=len(secrets)
    )


async def add_secret(request, user, data_type, payload, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    project_id = request.path_params.get("project_id")
    lower_title = payload.get("title").strip().lower()
    query = {
        "lower_title": lower_title,
        "created_by": user_id,
        "project_id": project_id,
        "secret_type": data_type,
    }

    secrets = secrets_manager.find_one(
        db,
        query,
    )
    if secrets:
        return response_helper(400, translate(f"{data_type}.already_exists"))

    payload.update(
        {
            "doc_id": create_uuid(),
            "created_by": user_id,
            "lower_title": lower_title,
            "project_id": project_id,
            "secret_type": data_type,
        }
    )
    secrets_manager.insert_one(db, payload)
    background_tasks.add_task(
        add_recent_activity,
        user,
        project_id,
        data_type,
        payload.get("doc_id"),
        "create",
    )
    # background_tasks.add_task(valkey_services.delete_secret, project_id, data_type)
    return response_helper(201, translate(f"{data_type}.add"), data=payload)


async def update_secret(request, user, data_type, payload, background_tasks):
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

        existing_details = secrets_manager.find_one(
            db,
            {
                "project_id": project_id,
                "lower_title": lower_title,
                "doc_id": {"$ne": doc_id},
                "secret_type": data_type,
            },
        )
        if existing_details:
            return response_helper(400, translate(f"{data_type}.already_exists"))

    # Update details
    secrets_manager.update_one(
        db,
        {"doc_id": doc_id},
        {"$set": payload},
    )
    background_tasks.add_task(
        add_recent_activity, user, project_id, data_type, doc_id, "update"
    )
    # background_tasks.add_task(valkey_services.delete_secret, project_id, data_type)
    return response_helper(200, translate(f"{data_type}.update"), data=payload)


async def delete_secret(request, user, data_type, background_tasks):
    db = user.get("db")
    doc_id = request.path_params.get("doc_id")
    project_id = request.path_params.get("project_id")

    if not secrets_manager.find_one(db, {"doc_id": doc_id, "secret_type": data_type}):
        return response_helper(404, translate(f"{data_type}.not_found"))

    secrets_manager.delete_one(db, {"doc_id": doc_id, "secret_type": data_type})
    background_tasks.add_task(
        add_recent_activity, user, project_id, data_type, doc_id, "delete"
    )
    # background_tasks.add_task(valkey_services.delete_secret, project_id, data_type)
    return response_helper(200, translate(f"{data_type}.delete"), data={})
