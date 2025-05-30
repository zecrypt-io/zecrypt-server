from app.framework.mongo_db import base_manager as db_manager
from app.managers.collection_names import SECRET


collection_name = SECRET


def insert_one(db, data):
    db_manager.insert_one(db, collection_name, data)
    data.pop("_id", None)


def insert_many(db, data_list):
    db_manager.insert_many(db, collection_name, data_list)


def update_one(db, query, payload, upsert=False):
    db_manager.update_one(db, collection_name, query, payload, upsert=upsert)


def update_many(db, query, payload):
    db_manager.update_many(db, collection_name, query, payload)


def find_one_and_update(db, query, update_query, return_document=True):
    details = db_manager.find_one_and_update(
        db, collection_name, query, update_query, return_document=return_document
    )
    details.pop("_id")
    return details


def delete_one(db, query):
    db_manager.delete_one(db, collection_name, query)


def delete_many(db, query):
    db_manager.delete_many(db, collection_name, query)


def distinct(db, field, query=None):
    return db_manager.distinct(db, collection_name, field, query)


def find_one(db, query, projection=None):
    return db_manager.find_one(db, collection_name, query, projection)


def find(db, query, projection=None, sort=None, skip=0, limit=0):
    cursor = db_manager.find(db, collection_name, query, projection, sort, skip, limit)
    return cursor


def count_documents(db, query):
    return db_manager.count_documents(db, collection_name, query)

def get_project_secrets_count(db,data_type, project_id):
    return count_documents(db, {"project_id": project_id, "data_type": data_type, "access": {"$ne":False}})