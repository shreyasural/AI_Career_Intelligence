from sqlalchemy import Column, Integer, String, Text
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