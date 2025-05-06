import uuid
from datetime import datetime, timedelta as timedzelta
import hashlib
import os
import json

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding

from app.core.config import settings
from app.utils.security.security_utils import encrypt_message, decrypt_message

public_key = settings.PUBLIC_KEY
private_key = settings.PRIVATE_KEY


def split_string_into_chunks(string, chunk_size=185):
    """
    Split a string into chunks of a specified size.

    Args:
    string (str): The string to split.
    chunk_size (int): The size of each chunk.

    Returns:
    list: A list containing the chunks of the string.
    """
    chunks = [string[i : i + chunk_size] for i in range(0, len(string), chunk_size)]
    if len(chunks) == 1:
        return encrypt_data(chunks[0])
    else:
        return [encrypt_data(item) for item in chunks]


def combine_chunks_into_string(data):
    """
    Combine a list of string chunks into a single string.

    Args:
    chunks (list): A list of string chunks.

    Returns:
    str: The combined string.
    """
    if isinstance(data, list):
        decrypted_data = [decrypt_data(item) for item in data]
        return "".join(decrypted_data)
    else:
        return decrypt_data(data)


def encrypt_data(data):
    public_key_obj = serialization.load_pem_public_key(
        public_key.encode("utf-8"), backend=default_backend()
    )
    ciphertext = public_key_obj.encrypt(
        data.encode("utf-8"),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return ciphertext


def decrypt_data(ciphertext):
    private_key_obj = serialization.load_pem_private_key(
        private_key.encode("utf-8"), password=None, backend=default_backend()
    )

    plaintext = private_key_obj.decrypt(
        ciphertext,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return plaintext.decode("utf-8")


def create_access_token(user_id):
    # Generate UUID
    generated_uuid = str(uuid.uuid4())

    # Get current time
    current_time = datetime.now()

    # Format current time as a string
    current_time_str = current_time.strftime("%Y-%m-%d %H:%M:%S")

    # Combine UUID and current time
    combined_string = f"{generated_uuid}_{current_time_str}"
    access_token = encrypt_message(combined_string, user_id)
    return access_token


def validate_access_token(access_token, user_id):
    decrypted_access_token = decrypt_message(access_token, user_id)
    # Split the combined string by underscore
    parts = decrypted_access_token.split("_")
    # Get the time portion (assuming it's the second part after splitting)
    time_str = parts[1]

    # Convert time string to datetime object
    extracted_time = datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")

    # Add 2 minutes to the extracted time
    extracted_time_plus_2_min = extracted_time + timedzelta(minutes=10)

    # Get the current time
    current_time = datetime.now()
    # Check if the extracted time plus 2 minutes is greater than current time
    if extracted_time_plus_2_min > current_time:
        return True
    else:
        return False


def hash_data(data, salt=None):
    """
    Securely hashes a given string or dict using SHA-256 with optional salt.
    For dicts, ensures consistent hashing by sorting keys.
    """
    if isinstance(data, dict):
        data_str = json.dumps(data, sort_keys=True, separators=(",", ":"))
    else:
        data_str = str(data)

    if salt is None:
        salt = os.urandom(16)  # Generate 16-byte random salt

    if isinstance(salt, str):
        salt = salt.encode("utf-8")

    hash_input = salt + data_str.encode("utf-8")
    return hashlib.sha512(hash_input).hexdigest(), salt.hex()
