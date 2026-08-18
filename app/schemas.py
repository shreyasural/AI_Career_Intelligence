from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class CareerProfileCreate(BaseModel):
    user_id: int
    skills: str
    education: str
    experience: str
    interests: str


class CareerProfileResponse(BaseModel):
    id: int
    user_id: int
    skills: str
    education: str
    experience: str
    interests: str

    class Config:
        from_attributes = True