from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, Base, SessionLocal
from app import models
from app.schemas import (
    UserCreate,
    UserResponse,
    CareerProfileCreate,
    CareerProfileResponse
)
from fastapi.responses import FileResponse
from app.voice import text_to_speech
from app.schemas import (
    UserCreate,
    UserResponse,
    CareerProfileCreate,
    CareerProfileResponse,
    InterviewAnswerRequest,
    InterviewResultCreate
)
from fastapi import UploadFile, File
import cv2
import numpy as np
from app.face_detection import detect_face
from app.career_engine import recommend_career, analyze_skill_gap, learning_roadmap, get_interview_questions, evaluate_interview_answer
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
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
    recommendations = recommend_career(
        profile.skills,
        profile.interests
    )

    recommended_career = recommendations[0] if recommendations else None

    new_profile = models.CareerProfile(
        user_id=profile.user_id,
        skills=profile.skills,
        education=profile.education,
        experience=profile.experience,
        interests=profile.interests,
        recommended_career=recommended_career
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile

@app.get("/career-profiles", response_model=list[CareerProfileResponse])
def get_career_profiles(db: Session = Depends(get_db)):
    return db.query(models.CareerProfile).all()
@app.get("/career-profile/{user_id}")
def get_user_career_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    profile = db.query(models.CareerProfile).filter(
        models.CareerProfile.user_id == user_id
    ).first()

    if not profile:
        return {"message": "Career profile not found"}

    return {
        "user_id": profile.user_id,
        "skills": profile.skills,
        "education": profile.education,
        "experience": profile.experience,
        "interests": profile.interests,
        "recommended_career": profile.recommended_career
    }
@app.get("/career-recommendation/{user_id}")
def career_recommendation(
    user_id: int,
    db: Session = Depends(get_db)
):
    profile = db.query(models.CareerProfile).filter(
        models.CareerProfile.user_id == user_id
    ).first()

    if not profile:
        return {"error": "Career profile not found"}

    recommendations = recommend_career(
        profile.skills,
        profile.interests
    )

    if not recommendations:
        return {"error": "No career recommendations found"}

    # Save the first recommendation in the database
    profile.recommended_career = recommendations[0]

    db.commit()
    db.refresh(profile)

    return {
        "user_id": user_id,
        "recommendations": recommendations,
        "recommended_career": profile.recommended_career
    }
@app.get("/skill-gap/{user_id}")
def skill_gap(user_id: int, db: Session = Depends(get_db)):

    profile = db.query(models.CareerProfile).filter(
        models.CareerProfile.user_id == user_id
    ).first()

    if not profile:
        return {"error": "Career profile not found"}

    recommendations = recommend_career(
        profile.skills,
        profile.interests
    )

    result = []

    for career in recommendations:
        gap = analyze_skill_gap(
            profile.skills,
            career
        )

        result.append(gap)

    return {
        "user_id": user_id,
        "skill_gap_analysis": result
    }
@app.get("/learning-roadmap/{user_id}")
def get_learning_roadmap(
    user_id: int,
    db: Session = Depends(get_db)
):

    profile = db.query(models.CareerProfile).filter(
        models.CareerProfile.user_id == user_id
    ).first()

    if not profile:
        return {"error": "Career profile not found"}

    recommendations = recommend_career(
        profile.skills,
        profile.interests
    )

    roadmap_result = []

    for career in recommendations:

        gap = analyze_skill_gap(
            profile.skills,
            career
        )

        roadmap = learning_roadmap(
            gap["missing_skills"]
        )

        roadmap_result.append({
            "career": career,
            "missing_skills": gap["missing_skills"],
            "learning_roadmap": roadmap
        })

    return {
        "user_id": user_id,
        "roadmaps": roadmap_result
    }
@app.get("/mock-interview/{user_id}")
def mock_interview(
    user_id: int,
    db: Session = Depends(get_db)
):

    profile = db.query(models.CareerProfile).filter(
        models.CareerProfile.user_id == user_id
    ).first()

    if not profile:
        return {"error": "Career profile not found"}

    recommendations = recommend_career(
        profile.skills,
        profile.interests
    )

    interviews = []

    for career in recommendations:

        questions = get_interview_questions(career)

        interviews.append({
            "career": career,
            "questions": questions
        })

    return {
        "user_id": user_id,
        "mock_interviews": interviews
    }

@app.post("/evaluate-answer")
def evaluate_answer(
    answer_data: InterviewAnswerRequest
):

    result = evaluate_interview_answer(
        answer_data.question,
        answer_data.answer,
        answer_data.career
    )

    return {
        "user_id": answer_data.user_id,
        "career": answer_data.career,
        "question": answer_data.question,
        "answer": answer_data.answer,
        "evaluation": result
    }
@app.get("/voice-question")
def voice_question(question: str):

    filename = text_to_speech(question)

    return FileResponse(
        path=filename,
        media_type="audio/mpeg",
        headers={
            "Accept-Ranges": "bytes"
        }
    )
@app.post("/detect-face")
async def detect_face_api(file: UploadFile = File(...)):
    contents = await file.read()

    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    face_detected = detect_face(frame)

    return {
        "face_detected": face_detected
    }
@app.post("/interview-results")
def save_interview_result(
    result_data: InterviewResultCreate,
    db: Session = Depends(get_db)
):
    result = models.InterviewResult(
        user_id=result_data.user_id,
        career=result_data.career,
        average_score=result_data.average_score,
        questions_answered=result_data.questions_answered,
        face_warnings=result_data.face_warnings,
        strengths=result_data.strengths,
        improvements=result_data.improvements
    )

    db.add(result)
    db.commit()
    db.refresh(result)

    return {
        "message": "Interview result saved successfully",
        "result_id": result.id
    }