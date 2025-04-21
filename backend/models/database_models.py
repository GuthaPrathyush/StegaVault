from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    name: str
    mail: str
    password: str

class LoginUser(BaseModel):
    mail: str
    password: str

class OwnershipVerificationRequest(BaseModel):
    nft_id: str
    owner_mail: str
