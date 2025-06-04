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


def get_db(db_name=settings.DB_NAME):
    """Get a specific database."""
    client = _get_client()
    return client[db_name]
