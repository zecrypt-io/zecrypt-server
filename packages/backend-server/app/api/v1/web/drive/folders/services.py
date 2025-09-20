from tkinter import N
from app.framework.mongo_db import base_manager as db_manager
from app.managers.collection_names import FOLDERS, FILES
from app.utils.utils import response_helper, create_uuid
from app.utils.i8ns import translate

async def create_folder(user, payload):
    db = user.get("db")
    user_id = user.get("user_id")
    lower_name = payload.get("name").strip().lower()
    query = {
        "lower_name": lower_name,
        "created_by": user_id,
    }
    if payload.get("parent_id"):
        query["parent_id"] = payload.get("parent_id")
    
    folder = db_manager.find_one(db, FOLDERS, query)
   
    if folder:
        return response_helper(400, translate("folder.already_exists"))
        
    payload.update({
        "doc_id": create_uuid(),
        "created_by": user_id,
        "parent_id": payload.get("parent_id"),
        "lower_name": lower_name,
    })

    folder = db_manager.insert_one(db, FOLDERS, payload)
    return response_helper(201, translate("folder.created"), data=folder)

async def get_folders(user, parent_id=None):
    db = user.get("db")
    user_id = user.get("user_id")
    query = {"created_by": user_id}
    if parent_id:
        query["parent_id"] = parent_id
    folders = db_manager.find(db, FOLDERS, query,{"_id":False})
    return response_helper(200, translate("folder.list"), data=folders)


async def get_folder_by_id(user, folder_id):
    db = user.get("db")
    user_id = user.get("user_id")
    folder_details = db_manager.find_one(db, FOLDERS, {"doc_id": folder_id,"created_by": user_id})
    if not folder_details:
        return response_helper(404, translate("folder.not_found"))
    
    folder_details.update({
        "sub_folders": db_manager.find(db, FOLDERS, {"parent_id": folder_id,"created_by": user_id},{"_id":False}),
        "files": db_manager.find(db, FILES, {"folder_id": folder_id,"created_by": user_id},{"_id":False})
        })
    return response_helper(200, translate("folder.list"), data=folder_details)


async def delete_folder(user, folder_id, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    folder = db_manager.find_one(db, FOLDERS, {"doc_id": folder_id,"created_by": user_id})
    if not folder:
        return response_helper(404, translate("folder.not_found"))
    
    db_manager.delete_one(db, FOLDERS, {"doc_id": folder_id,"created_by": user_id})
    background_tasks.add_task(delete_folder_data, db, user_id, folder_id)
    return response_helper(200, translate("folder.deleted"))

def delete_folder_data(db,user_id, folder_id):
    db_manager.delete_many(db, FOLDERS, {"parent_id": folder_id,"created_by": user_id})
    db_manager.delete_many(db, FILES, {"folder_id": folder_id,"created_by": user_id})

async def rename_folder(user, payload):
    db = user.get("db")
    user_id = user.get("user_id")
    lower_name = payload.get("name").strip().lower()
    payload["lower_name"] = lower_name
    query = {
        "lower_name": lower_name,
        "created_by": user_id,
    }
    if payload.get("parent_id"):
        query["parent_id"] = payload.get("parent_id")
    
    existing_folder = db_manager.find_one(db, FOLDERS, query)
    if existing_folder:
        return response_helper(400, translate("folder.already_exists"))
        
    db_manager.update_one(db, FOLDERS, {"doc_id": payload.get("folder_id"),"created_by": user_id}, {"$set": {"name": payload.get("name")}, "lower_name":lower_name})
    return response_helper(200, translate("folder.renamed"))