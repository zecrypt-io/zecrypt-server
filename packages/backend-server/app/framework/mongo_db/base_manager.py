def insert_one(db, collection_name, data):
    return db[collection_name].insert_one(data)


def insert_many(db, collection_name, data_list):
    db[collection_name].insert_many(data_list)


def update_one(db, collection_name, query, payload, upsert=False, array_filters=None):
    db[collection_name].update_one(
        query, payload, upsert=upsert, array_filters=array_filters
    )


def update_many(db, collection_name, query, payload):
    db[collection_name].update_many(query, payload)


def find_one_and_update(
    db, collection_name, query, update_query, return_document=False
):
    return db[collection_name].find_one_and_update(
        query, update_query, return_document=return_document
    )


def delete_one(db, collection_name, query):
    db[collection_name].update_one(query, {"$set": {"access": False}})


def delete_many(db, collection_name, query):
    db[collection_name].update_many(query, {"$set": {"access": False}})


def bulk_write(db, collection_name, data):
    db[collection_name].bulk_write(data)


def find_one(db, collection_name, query, projection=None):
    if projection is None:
        projection = {"_id": False}
    return db[collection_name].find_one(query, projection)


def find(
    db,
    collection_name,
    query,
    projection=None,
    sort=None,
    skip=0,
    limit=0,
    collation=None,
):
    if projection is None:
        projection = {"_id": False}
    if not collation:
        cursor = db[collection_name].find(query, projection)
    else:
        cursor = db[collection_name].find(query, projection).collation(collation)
    if skip:
        cursor = cursor.skip(skip)
    if limit:
        cursor = cursor.limit(limit)

    if sort:
        if isinstance(sort, tuple):
            sort = [sort]
        cursor = cursor.sort(sort)
    return list(cursor)


def count_documents(db, collection_name, query, collation=None):
    if not collation:
        return db[collection_name].count_documents(query)
    else:
        return db[collection_name].count_documents(query)


def distinct(db, collection_name, field, query):
    if query is None:
        query = {}
    return db[collection_name].distinct(field, query)


def aggregate(db, collection_name, query):
    data = db[collection_name].aggregate(query)
    return list(data)


def create_index(db, collection_name, field):
    db[collection_name].create_index(field)


def drop_index(db, collection_name, name):
    db[collection_name].drop_index(name)


def list_indexes(db, collection_name):
    db[collection_name].list_indexes()
