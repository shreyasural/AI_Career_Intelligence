from sqlalchemy import Column, Integer, String, Text, Float
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)


class CareerProfile(Base):
    __tablename__ = "career_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    skills = Column(Text)
    education = Column(String)
    experience = Column(Text)
    interests = Column(Text)
    recommended_career = Column(String)
class InterviewResult(Base):
    __tablename__ = "interview_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    career = Column(String, nullable=False)
    average_score = Column(Float, nullable=False)
    questions_answered = Column(Integer, nullable=False)
    face_warnings = Column(Integer, default=0)
    strengths = Column(Text)
    improvements = Column(Text)