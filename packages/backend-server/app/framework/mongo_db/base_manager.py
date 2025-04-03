import hashlib
import json
from functools import wraps

from app.framework.redis_client.redis import RedisClient

redis = RedisClient()


# Cache invalidation decorator
def clear_cache_after(func):
    @wraps(func)
    def wrapper(db, collection_name, *args, **kwargs):
        # Call the original function
        result = func(db, collection_name, *args, **kwargs)

        # Clear cache using db and collection_name
        delete_repo_hash( collection_name)
        return result

    return wrapper


def delete_repo_hash(collection_name):
    """Batch delete all related cache entries"""
    hashes = [
        f"{collection_name}_details",
        f"{collection_name}_list",
    ]
    redis.delete_hash(hashes)

def generate_query_hash(query, projection=None, sort=None, skip=0, limit=0):

    # Convert all parameters to a string representation
    query_str = json.dumps(query, sort_keys=True)
    projection_str = json.dumps(projection, sort_keys=True) if projection else ""
    sort_str = json.dumps(sort, sort_keys=True) if sort else ""
    skip_str = str(skip) if skip else ""
    limit_str = str(limit) if limit else ""

    # Combine all parts into a single string
    combined_str = f"{query_str}-{projection_str}-{sort_str}-{skip_str}-{limit_str}"

    # Generate a hash from the combined string
    return hashlib.sha256(combined_str.encode()).hexdigest()


@clear_cache_after
def insert_one(db, collection_name, data):
    return db[collection_name].insert_one(data)


@clear_cache_after
def insert_many(db, collection_name, data_list):
    db[collection_name].insert_many(data_list)


@clear_cache_after
def update_one(db, collection_name, query, payload, upsert=False, array_filters=None):
    db[collection_name].update_one(
        query, payload, upsert=upsert, array_filters=array_filters
    )


@clear_cache_after
def update_many(db, collection_name, query, payload):
    db[collection_name].update_many(query, payload)


@clear_cache_after
def find_one_and_update(
    db, collection_name, query, update_query, return_document=False
):
    return db[collection_name].find_one_and_update(
        query, update_query, return_document=return_document
    )


@clear_cache_after
def delete_one(db, collection_name, query):
    db[collection_name].update_one(query, {"$set": {"is_active": False}})


@clear_cache_after
def delete_many(db, collection_name, query):
    db[collection_name].update_many(query, {"$set": {"is_active": False}})


@clear_cache_after
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


def redis_find(db, collection_name, query, projection=None, sort=None, skip=0, limit=0):
    query_hash = generate_query_hash(query, projection, sort, skip, limit)
    list_hash_name = f"{db.name}_{collection_name}_list"

    if redis.field_exists_in_hash(list_hash_name, query_hash):
        return redis.get_from_hash(list_hash_name, query_hash)
    else:
        cursor = find(db, collection_name, query, projection, sort, skip, limit)
        redis.add_key_to_hash(list_hash_name, query_hash, cursor)
        return cursor


def redis_find_one(db, collection_name, query, projection=None):
    DETAILS_HASH = f"{db.name}_{collection_name}_details"
    query_hash = generate_query_hash(query, projection)

    # Try to get from cache first
    cached_data = redis.get_from_hash(DETAILS_HASH, query_hash)

    if cached_data is not None:
        return cached_data

    data = find_one(db, collection_name, query, projection)

    if data:
        redis.add_key_to_hash(DETAILS_HASH, query_hash, data)

    return data


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
