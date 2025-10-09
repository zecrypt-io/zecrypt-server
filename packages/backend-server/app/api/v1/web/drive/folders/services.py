
from app.framework.mongo_db import base_manager as db_manager
from app.managers.collection_names import FILES, FOLDERS
from app.utils.utils import response_helper, create_uuid, create_timestamp
from app.utils.i8ns import translate

async def create_folder(user, payload):
    db = user.get("db")
    folder_id = create_uuid()
    query={
        "created_by": user.get("user_id"),
        "lower_name": payload.get("name").strip().lower(),
    }
    if payload.get("parent_id"):
        query["parent_id"] = payload.get("parent_id")
        folder = db_manager.find_one(db, FOLDERS, query)
        if  folder:
            return response_helper(400, translate("drive.folders.already_exists"))

    folder = {
        "doc_id": folder_id,
        "name": payload.get("name"),
        "parent_id": payload.get("parent_id"),
        "created_by": user.get("user_id"),
        "lower_name": payload.get("name").strip().lower(),
        "created_at": create_timestamp(),

    }
    db_manager.insert_one(db, FOLDERS, folder)
    return response_helper(200, translate("drive.folders.created"))


async def delete_folders(user, payload):
    db = user.get("db")
    folder_ids = payload.get("folder_ids")
    user_id = user.get("user_id")
    db_manager.update_many(db, FOLDERS, {"doc_id": {"$in":folder_ids}, "created_by": user_id}, {"$set": {"access": False,"delete_by":user_id, "deleted_at": create_timestamp()}})
    return response_helper(200, translate("drive.folders.deleted"))


async def rename_folder(user, payload):
    db = user.get("db")
    name = payload.get("name").strip()
    folder_id = payload.get("folder_id")
    lower_name= name.lower()
    query={"created_by": user.get("user_id"), "lower_name": lower_name}

    if payload.get("parent_id"):
        query["parent_id"] = payload.get("parent_id")
    folder = db_manager.find_one(db, FOLDERS, query)
    
    if folder:
        return response_helper(400, translate("drive.folders.already_exists"))
    
    db_manager.update_one(db, FOLDERS, {"doc_id": folder_id, "created_by": user.get("user_id")}, {"$set": {"name": name, "lower_name": lower_name}})
    return response_helper(200, translate("drive.folders.renamed"))


async def move_folders(user, payload):
    db = user.get("db")
    folder_ids = payload.get("folder_ids")
    parent_id = payload.get("parent_id")
    query={"created_by": user.get("user_id"), "doc_id": {"$in":folder_ids}}
    folders = db_manager.find(db, FOLDERS, query)
    folders_moved=[]
    for item in folders:
        individual_query={"created_by": user.get("user_id"), "parent_id": parent_id, "lower_name": item.get("lower_name")}
        if not db_manager.find_one(db, FOLDERS, individual_query):
            db_manager.update_one(db, FOLDERS, {"doc_id": item.get("doc_id")}, {"$set": {"parent_id": parent_id}})
            folders_moved.append(item.get("name"))


    db_manager.update_many(db, FOLDERS, {"doc_id": {"$in":folder_ids}, "created_by": user.get("user_id")}, {"$set": {"parent_id": parent_id}})
    return response_helper(200, translate("drive.folders.moved"), folders_moved=folders_moved)

async def get_folders_list(user, parent_id):
    db = user.get("db")
    query = {"created_by": user.get("user_id")}
    if parent_id:
        query["parent_id"] = parent_id
    
    folders = db_manager.find(db, FOLDERS, query)
    
    for folder in folders:
        parent_query={"parent_id": folder.get("doc_id"),"created_by": user.get("user_id")}
        files = db_manager.find(db, FILES,parent_query )
        folder["files"] = files
        folder["sub_folders"] = db_manager.find(db, FOLDERS, parent_query)
    
    data= {
        "folders": folders,
        "files": db_manager.find(db, FILES, query)
    }
    return response_helper(200, translate("drive.folders.list"), data=data)