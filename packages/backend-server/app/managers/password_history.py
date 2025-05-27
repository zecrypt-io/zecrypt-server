from app.framework.mongo_db import base_manager as db_manager
from app.managers.collection_names import PASSWORD_HISTORY


collection_name = PASSWORD_HISTORY


def insert_one(db, data):
    db_manager.insert_one(db, collection_name, data)


def insert_many(db, data_list):
    db_manager.insert_many(db, collection_name, data_list)


def update_one(db, query, payload, upsert=False):
    db_manager.update_one(db, collection_name, query, payload, upsert=upsert)


def update_many(db, query, payload):
    db_manager.update_many(db, collection_name, query, payload)


def find_one_and_update(db, query, update_query, return_document=False):
    return db_manager.find_one_and_update(
        db, collection_name, query, update_query, return_document=return_document
    )


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
