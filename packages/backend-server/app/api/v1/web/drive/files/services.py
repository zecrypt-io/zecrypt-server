from app.framework.mongo_db import base_manager as db_manager
from app.managers.collection_names import FILES, FOLDERS
from app.utils.utils import response_helper, create_uuid, get_file_extension, get_folders_from_path, create_timestamp
from app.utils.i8ns import translate
from app.utils.s3_utils import generate_upload_url, generate_download_url



def get_files_list(user, parent_id=None):
    db = user.get("db")
    query = {"created_by": user.get("user_id")}
    if parent_id:
        query["parent_id"] = parent_id
    files = db_manager.find(db, FILES, query)
    for file in files:
        file["file_url"]= generate_download_url(file.get("key"), 360000)
    return files 

async def get_presigned_url(user, payload):
    db = user.get("db")
    user_id = user.get("user_id")
    file_name = payload.get("name")
    
    # Check if file already exists for this user
    query = {
        "lower_name": file_name.strip().lower(),
        "created_by": user_id
    }
    if payload.get("parent_id"):
        query["parent_id"] = payload.get("parent_id")
    
    file = db_manager.find_one(db, FILES, query)
    if file:
        return response_helper(400, translate("drive.files.already_exists"))
    
    # Generate file paths
    file_id = create_uuid()
    file_extension = get_file_extension(file_name)
    final_file_path = f"{user_id}/files/{file_id}.{file_extension}"
    
    # Get folders from path
    folders = get_folders_from_path(payload.get("file_path"))
    parent_id = payload.get("parent_id")
    
    # Create folder hierarchy if folders exist
    for folder_name in folders:
        query = {
            "created_by": user_id, 
            "lower_name": folder_name.strip().lower()
        }
        if parent_id:
            query["parent_id"] = parent_id
        
        folder_details = db_manager.find_one(db, FOLDERS, query)
        if not folder_details:
            # Create new folder
            folder_data = {
                "doc_id": create_uuid(),
                "name": folder_name.strip(),
                "parent_id": parent_id,
                "created_by": user_id,
                "lower_name": folder_name.strip().lower(),
            }
            db_manager.insert_one(db, FOLDERS, folder_data)
            parent_id = folder_data.get("doc_id")
        else:
            # Use existing folder
            parent_id = folder_details.get("doc_id")
    
    # Insert file record (always, regardless of whether folders exist)
    file_data = {
        "doc_id": file_id,
        "type": payload.get("file_type"),
        "name": file_name,
        "lower_name": file_name.strip().lower(),
        "size": payload.get("size"),
        "path": payload.get("file_path"),
        "key": final_file_path,
        "parent_id": parent_id,
        "created_by": user_id,
        "iv": payload.get("iv"),
    }
    db_manager.insert_one(db, FILES, file_data)
    
    # Generate presigned upload URL
    upload_url = generate_upload_url(final_file_path)
    
    return response_helper(200, translate("file.get_presigned_url"), data=upload_url)


async def rename_file(user, payload):
    db = user.get("db")
    name = payload.get("name").strip()
    file_id = payload.get("file_id")
    lower_name = name.lower()
    query = {"created_by": user.get("user_id"), "lower_name": lower_name, "doc_id": {"$ne": file_id}}
    
    if payload.get("parent_id"):
        query["parent_id"] = payload.get("parent_id")
    
    file = db_manager.find_one(db, FILES, query)
    if file:
        return response_helper(400, translate("drive.files.already_exists"))
    
    db_manager.update_one(db, FILES, {"doc_id": file_id, "created_by": user.get("user_id")}, {"$set": {"name": name, "lower_name": lower_name}})
    return response_helper(200, translate("drive.files.renamed"))


async def delete_files(user, payload):
    db = user.get("db")
    file_ids = payload.get("file_ids")
    user_id = user.get("user_id")
    db_manager.update_many(db, FILES, {"doc_id": {"$in": file_ids}, "created_by": user_id}, {"$set": {"access": False, "delete_by": user_id, "deleted_at": create_timestamp()}})
    return response_helper(200, translate("drive.files.deleted"))


async def move_files(user, payload):
    db = user.get("db")
    file_ids = payload.get("file_ids")
    parent_id = payload.get("parent_id")
    query = {"created_by": user.get("user_id"), "doc_id": {"$in": file_ids}}
    files = db_manager.find(db, FILES, query)
    files_moved = []
    for item in files:
        individual_query = {"created_by": user.get("user_id"), "parent_id": parent_id, "lower_name": item.get("lower_name")}
        if not db_manager.find_one(db, FILES, individual_query):
            db_manager.update_one(db, FILES, {"doc_id": item.get("doc_id")}, {"$set": {"parent_id": parent_id}})
            files_moved.append(item.get("name"))
    
    return response_helper(200, translate("drive.files.moved"), files_moved=files_moved)
