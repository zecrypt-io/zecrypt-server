import base64
import hashlib
import random
import re
import string
from base64 import b64encode, b64decode

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

from app.core.config import settings
from app.framework.redis_client.redis import RedisClient
from app.utils.logger import get_logger

jwt_secret = settings.JWT_SECRET
jwt_algo = settings.JWT_ALGORITHM

logger = get_logger("Security")
redis = RedisClient()


def generate_passphrase(length=16):
    # list of uppercase letters and digits
    chars = string.ascii_uppercase + string.digits
    # generate the passphrase by selecting random characters
    return "".join(random.choice(chars) for _ in range(length))


def generate_key(company_id):
    """Generates a key and save it into a file"""
    passphrase = generate_passphrase(length=10)
    try:
        key = hashlib.md5(bytes(passphrase, "utf-8")).digest()
        base64_data = base64.b64encode(key).decode("utf-8")
        secrets_manager.add_secret(f"encryption_keys/{company_id}", base64_data)
    except Exception as e:
        logger.error(e.__str__())


cipher_cache = {}


def get_cipher(company_id):
    """Retrieve or create a cipher instance for the given company ID."""
    if company_id not in cipher_cache:
        key = secrets_manager.read_secret(f"encryption_keys/{company_id}")
        key = base64.b64decode(key)
        cipher_cache[company_id] = AES.new(key, AES.MODE_ECB)
    return cipher_cache[company_id]


def encrypt_message(message, company_id):
    """
    Encrypts a message using AES encryption for a specific company.

    Parameters:
    message (str): The message to be encrypted.
    company_id (str): The ID of the company for which the message is encrypted.

    Returns:
    str: The encrypted message in base64 encoding or None if message is None.
    """
    if message is None:
        return None

    try:
        cipher = get_cipher(company_id)
        data = message.encode()
        ct_bytes = cipher.encrypt(pad(data, AES.block_size))
        return b64encode(ct_bytes).decode("utf-8")
    except Exception:
        # Log the exception e
        return None


def decrypt_message(encrypted_message, company_id):
    """Decrypts an encrypted message"""
    hash_name = f"{DECRYPTION_HASH}_{company_id}"
    if not encrypted_message:
        return encrypted_message

    if encrypted_message.startswith("FR_"):
        return encrypted_message

    try:
        if redis.field_exists_in_hash(hash_name, encrypted_message):
            return redis.get_from_hash(hash_name, encrypted_message)
    except Exception:
        pass

    try:
        key = secrets_manager.read_secret(f"encryption_keys/{company_id}")
        key = base64.b64decode(key.encode("utf-8"))
        ct = b64decode(encrypted_message)
        cipher = AES.new(key, AES.MODE_ECB)
        pt = unpad(cipher.decrypt(ct), AES.block_size)
        response = pt.decode("utf-8")
        redis.add_key_to_hash(hash_name, encrypted_message, response)
        return response
    except Exception:
        return encrypted_message
