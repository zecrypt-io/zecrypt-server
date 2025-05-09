from typing import Optional

from pydantic import BaseModel


class CreateUser(BaseModel):
    uid: str
    email: Optional[str] = None
    login_method: str


class Login(BaseModel):
    uid: str


class SignUp(BaseModel):
    uid: str


class UserDetails(BaseModel):
    user_id: str
    name: Optional[str] = None
    profile_url: Optional[str] = None
    phone_number: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None


class UpdateProfile(BaseModel):
    name: Optional[str] = None
    profile_url: Optional[str] = None
    phone_number: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None


class TwoFactorAuth(BaseModel):
    code: str
    user_id: str
