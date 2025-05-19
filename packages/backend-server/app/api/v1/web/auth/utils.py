from app.managers import user_keys as user_keys_manager



def get_public_key(db, user_id):
    user_keys = user_keys_manager.find_one(db, {"user_id": user_id})
    if not user_keys:
        return None
    return user_keys.get("public_key")


def get_private_key(db, user_id):
    user_keys = user_keys_manager.find_one(db, {"user_id": user_id})
    if not user_keys:
        return None
    return user_keys.get("private_key")
