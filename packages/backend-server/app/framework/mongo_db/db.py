from pymongo import MongoClient

from app.core.config import settings

# Global variable for the MongoDB client
_client = None


def _get_client():
    """Helper function to initialize the MongoDB client if it hasn't been initialized."""
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGO_DB_URL, maxIdleTimeMS=300000)
    return _client


def get_db(db_name="ZecryptDev"):
    """Get a specific database."""
    client = _get_client()
    return client[db_name]


def get_dbs_list():
    """List all database names."""
    client = _get_client()
    return client.list_database_names()


def get_labs_dbs_list():
    """List all database names that start with 'COMP'."""
    client = _get_client()
    return [db for db in client.list_database_names() if db.startswith("COMP")]
