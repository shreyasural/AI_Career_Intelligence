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
        from pydantic import BaseModel


class InterviewAnswerRequest(BaseModel):
    user_id: int
    career: str
    question: str
    answer: str
class InterviewResultCreate(BaseModel):
    user_id: int
    career: str
    average_score: float
    questions_answered: int
    face_warnings: int = 0
    strengths: str = ""
    improvements: str = ""