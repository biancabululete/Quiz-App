from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: str
    nume: str | None = None
    avatar_url: str | None = None
    google_id: str | None = None
    rol: str = "USER"

class UserRegister(BaseModel):
    email: EmailStr
    nume: str | None = None
    password: str
    rol: str = "USER" 

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    nume: str | None = None
    avatar_url: str | None = None
    current_password: str | None = None
    new_password: str | None = None