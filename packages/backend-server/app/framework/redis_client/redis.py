import json

import redis

from app.core.config import settings

redis_client = redis.Redis.from_url(url=settings.REDIS_URL)


class RedisClient:
    def __init__(self):
        """
        Initialize a new instance of redis client
        """
        self.client = redis_client

    def add_key(self, key, value, expiry=None):
        """
        Add a new key-value pair

        :param key: The key of the item.
        :param value: The value to be stored.
        :param expiry: Expiry time in seconds (default is None, meaning "forever").
        """
        if expiry is None:
            self.client.set(key, value)
        else:
            self.client.setex(key, expiry, value)

    def get_key(self, key):
        """
        Get a key-value pair

        :param key: The key of the item.
        """
        return self.client.get(key)

    def remove_key(self, key):
        """
        Remove a key-value pair

        :param key: The key of the item to remove.
        """
        self.client.delete(key)

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

    def key_exists(self, key):
        """
        Check if a key exists in the redis cache

        :param key: The key of the item to check.
        :returns: True if the key exists, False otherwise.
        """
        return self.client.exists(key) > 0

    def add_to_set(self, name, value):
        """
        Add a new value to a set

        :param name: The name of the set.
        :param value: The value to add to the set.
        """
        self.client.sadd(name, value)

    def get_list_from_set(self, name):
        docs = list(self.client.smembers(name))
        string_list = [byte.decode("utf-8") for byte in docs]
        return string_list

    def remove_from_set(self, name, value):
        """
        Remove a value from a set

        :param name: The name of the set.
        :param value: The value to remove from the set.
        """
        self.client.srem(name, json.dumps(value, default=str))

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

    def add_to_list(self, name, value):
        """
        Add a new item to a list
        :param name: The name of the list.
        :param value: The value to add to the list.
        """
        # self.client.rpush(name, json.dumps(value, default=str))
        self.client.rpush(name, value)

    def remove_from_list(self, name, value):
        """
        Remove an item from a list
        :param name: The name of the list.
        :param value: The value to remove from the list.
        """
        self.client.lrem(name, 0, json.dumps(value, default=str))

    def get_all_from_list(self, name):
        """
        Get all items from a list
        :param name: The name of the list.
        :returns: A list of all items in the list.
        """
        items = self.client.lrange(name, 0, -1)
        return [json.loads(item) for item in items]

    def get_all_keys_from_hash(self, name):
        """
        Get all keys from a hash
        :param name: The name of the hash.
        :returns: A list of all keys in the hash.
        """
        keys = list(self.client.hkeys(name))
        return [key.decode("utf-8") for key in keys]

    def add_to_sorted_set(self, name, value, score=0):
        """
        Add a new item to a sorted set
        :param name: The name of the sorted set.
        :param value: The value to add to the sorted set.
        :param score: The score of the item to add to the sorted set.
        """
        self.client.zadd(name, {value: score}, nx=True)

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
