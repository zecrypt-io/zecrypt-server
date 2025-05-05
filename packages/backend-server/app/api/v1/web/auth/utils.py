from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str):
    return pwd_context.hash(password)


def check_password(password: str, hashed_password: str):
    return pwd_context.verify(password, hashed_password)
