import uuid
from datetime import datetime, timedelta as timedzelta


from app.utils.security.security_utils import encrypt_message, decrypt_message


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
