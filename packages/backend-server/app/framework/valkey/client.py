import json

import valkey

from app.core.config import settings

valkey_client = valkey.Valkey.from_url(url=settings.VALKEY_URL)


class ValkeyClient:
    def __init__(self):
        """
        Initialize a new instance of redis client
        """
        self.client = valkey_client

    def add_key_to_hash(self, name, key, value):
        """
        Add a new key-value pair to a hash

        :param name: The name of the hash.
        :param key: The key of the item.
        :param value: The value to be stored.
        """
        if self.client.hexists(name, key):
            self.client.hdel(name, key)
        self.client.hset(name, key, json.dumps(value, default=str))

    def remove_key_from_hash(self, name, key):
        """
        Remove a key-value pair from a hash

        :param name: The name of the hash.
        :param key: The key of the item to remove.
        """
        try:
            self.client.hdel(name, key)
        except Exception:
            pass

    def get_from_hash(self, name, key):
        """
        Get a value from a hash
        :param name: The name of the hash.
        :param key: The key of the item to get.
        :returns: The value of the item.
        """
        try:
            return json.loads(self.client.hget(name, key))
        except Exception:
            return None

    def field_exists_in_hash(self, name, key):
        """
        Check if a field exists in a hash
         :param name: The name of the hash.
        :param key: The key of the item to get.
        :returns: True if the field exists, False otherwise.
        """
        return self.client.hexists(name, key)

    def get_all_keys_from_hash(self, name):
        """
        Get all keys from a hash
        :param name: The name of the hash.
        :returns: A list of all keys in the hash.
        """
        keys = list(self.client.hkeys(name))
        return [key.decode("utf-8") for key in keys]

    def delete_hash(self, hash):
        try:
            if isinstance(hash, str):
                self.client.delete(hash)
            else:
                self.client.delete(*hash)
        except Exception:
            pass

    def check_hash_exists(self, hash_key):
        if self.client.exists(hash_key) and self.client.type(hash_key) == b"hash":
            return True
        return False
