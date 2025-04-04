import base64
import hashlib
import random
import string

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

from app.framework.mongo_db.db import get_db

db = get_db()


def generate_passphrase(length=16):
    # list of uppercase letters and digits
    chars = string.ascii_uppercase + string.digits
    # generate the passphrase by selecting random characters
    return "".join(random.choice(chars) for _ in range(length))


def generate_aes_key():
    passphrase = generate_passphrase(32)
    # Generate a random 32-byte (256-bit) key
    key = hashlib.md5(bytes(passphrase, "utf-8")).digest()
    base64_data = base64.b64encode(key).decode("utf-8")
    return base64_data, passphrase


aes_cache = {}


def get_aes_key(user_id):
    if user_id not in aes_cache:
        details = db.user_credentials.find_one({"user_id": user_id}, {"_id": False})
        key = base64.b64decode(details.get("key"))
        aes_cache[user_id] = AES.new(key, AES.MODE_ECB)
    return aes_cache[user_id]


def encrypt_message(message, user_id):
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
        cipher = get_aes_key(user_id)
        data = message.encode()
        ct_bytes = cipher.encrypt(pad(data, AES.block_size))
        return base64.b64encode(ct_bytes).decode("utf-8")
    except Exception:
        # Log the exception e
        return None


def decrypt_message(encrypted_message, user_id):
    """Decrypts an encrypted message"""
    if encrypted_message:
        try:
            cipher = get_aes_key(user_id)
            ct = base64.b64decode(encrypted_message)
            pt = unpad(cipher.decrypt(ct), AES.block_size)
            return pt.decode("utf-8")
        except Exception:
            return encrypted_message
    else:
        return encrypted_message
