from app.framework.valkey.client import ValkeyClient
from app.utils.utils import generate_query_hash

valkey_client = ValkeyClient()


def add_secret(project_id, secret_type, query, secret_value):
    query_hash = generate_query_hash(query)
    valkey_client.add_key_to_hash(
        f"{project_id}:{secret_type}", query_hash, secret_value
    )


def get_secret(project_id, secret_type, query):
    query_hash = generate_query_hash(query)
    return valkey_client.get_from_hash(f"{project_id}:{secret_type}", query_hash)


def delete_secret(project_id, secret_type):
    valkey_client.delete_hash(f"{project_id}:{secret_type}")


def check_secret_exists(project_id, secret_type, query):
    query_hash = generate_query_hash(query)
    return valkey_client.field_exists_in_hash(f"{project_id}:{secret_type}", query_hash)
