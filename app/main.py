from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.database import engine, Base, SessionLocal
from app import models
from app.schemas import (
    UserCreate,
    UserResponse,
    CareerProfileCreate,
    CareerProfileResponse
)

Base.metadata.create_all(bind=engine)

app = FastAPI()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "AI Career Intelligence API is working!"}


@app.get("/test-db")
def test_db():
    try:
        with engine.connect():
            return {"message": "PostgreSQL connected successfully!"}
    except Exception as e:
        return {"error": str(e)}


@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    new_user = models.User(
        name=user.name,
        email=user.email
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()
@app.post("/career-profile", response_model=CareerProfileResponse)
def create_career_profile(
    profile: CareerProfileCreate,
    db: Session = Depends(get_db)
):
    new_profile = models.CareerProfile(
        user_id=profile.user_id,
        skills=profile.skills,
        education=profile.education,
        experience=profile.experience,
        interests=profile.interests
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile