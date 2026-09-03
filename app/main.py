from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.pdfbase.pdfmetrics import stringWidth
from datetime import datetime
from app.database import engine, Base, SessionLocal
from app import models
from app.schemas import (
    UserCreate,
    UserResponse,
    CareerProfileCreate,
    CareerProfileResponse
)
from app.career_engine import (
    recommend_career,
    analyze_skill_gap,
    learning_roadmap,
    get_interview_questions,
    evaluate_interview_answer,
    get_multiple_career_recommendations,
    get_career_readiness_analysis,
    get_career_gap_action_plan
)
from fastapi.responses import FileResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import os
from app.voice import text_to_speech
from app.schemas import (
    UserCreate,
    UserResponse,
    CareerProfileCreate,
    CareerProfileResponse,
    InterviewAnswerRequest,
    InterviewResultCreate
)
from app.career_engine import get_multiple_career_recommendations
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
@app.get("/interview-results/{user_id}")
def get_interview_results(
    user_id: int,
    db: Session = Depends(get_db)
):
    results = (
        db.query(models.InterviewResult)
        .filter(models.InterviewResult.user_id == user_id)
        .all()
    )

    return results
@app.get("/download-report/{user_id}")
@app.get("/download-report/{user_id}")
def download_report(user_id: int, db: Session = Depends(get_db)):

    results = (
        db.query(models.InterviewResult)
        .filter(models.InterviewResult.user_id == user_id)
        .order_by(models.InterviewResult.id.desc())
        .all()
    )

    if not results:
        raise HTTPException(
            status_code=404,
            detail="No interview results found"
        )

    result = results[0]

    file_name = f"AI_Interview_Report_{user_id}.pdf"

    file_path = os.path.join(
        os.getcwd(),
        file_name
    )

    pdf = canvas.Canvas(
        file_path,
        pagesize=A4
    )

    width, height = A4

    # --------------------------------------------------
    # COLORS
    # --------------------------------------------------

    dark = HexColor("#172033")
    accent = HexColor("#4F46E5")
    light = HexColor("#EEF2FF")
    green = HexColor("#16A34A")
    orange = HexColor("#EA580C")
    red = HexColor("#DC2626")
    gray = HexColor("#64748B")
    light_gray = HexColor("#F8FAFC")
    border = HexColor("#E2E8F0")

    # --------------------------------------------------
    # HELPER FUNCTIONS
    # --------------------------------------------------

    def draw_footer():

        pdf.setStrokeColor(border)

        pdf.line(
            50,
            38,
            width - 50,
            38
        )

        pdf.setFont(
            "Helvetica",
            8
        )

        pdf.setFillColor(gray)

        pdf.drawString(
            50,
            24,
            "AI Career Intelligence"
        )

        pdf.drawRightString(
            width - 50,
            24,
            "AI Interview Assessment"
        )

    def new_page():

        draw_footer()

        pdf.showPage()

        return height - 55

    def draw_section_title(title, y):

        pdf.setFillColor(accent)

        pdf.roundRect(
            50,
            y - 5,
            8,
            20,
            4,
            fill=1,
            stroke=0
        )

        pdf.setFillColor(dark)

        pdf.setFont(
            "Helvetica-Bold",
            14
        )

        pdf.drawString(
            68,
            y,
            title
        )

        return y - 28

    def draw_wrapped_text(
        text,
        x,
        y,
        max_width,
        font="Helvetica",
        size=10,
        leading=16
    ):

        pdf.setFont(
            font,
            size
        )

        pdf.setFillColor(dark)

        words = str(text).split()

        line = ""

        for word in words:

            test = (
                word
                if not line
                else line + " " + word
            )

            if stringWidth(
                test,
                font,
                size
            ) <= max_width:

                line = test

            else:

                pdf.drawString(
                    x,
                    y,
                    line
                )

                y -= leading

                line = word

        if line:

            pdf.drawString(
                x,
                y,
                line
            )

            y -= leading

        return y

    # --------------------------------------------------
    # DATE
    # --------------------------------------------------

    report_date = datetime.now().strftime(
        "%d %B %Y, %I:%M %p"
    )

    # --------------------------------------------------
    # PERFORMANCE LEVEL
    # --------------------------------------------------

    score = float(result.average_score)

    if score >= 8:

        rating = "Excellent"
        rating_color = green

    elif score >= 6:

        rating = "Good"
        rating_color = accent

    elif score >= 4:

        rating = "Needs Improvement"
        rating_color = orange

    else:

        rating = "Requires Improvement"
        rating_color = red

    # ==================================================
    # HEADER
    # ==================================================

    pdf.setFillColor(dark)

    pdf.rect(
        0,
        height - 145,
        width,
        145,
        fill=1,
        stroke=0
    )

    pdf.setFillColor(colors.white)

    pdf.setFont(
        "Helvetica-Bold",
        26
    )

    pdf.drawString(
        50,
        height - 60,
        "AI INTERVIEW"
    )

    pdf.setFont(
        "Helvetica-Bold",
        18
    )

    pdf.drawString(
        50,
        height - 88,
        "PERFORMANCE REPORT"
    )

    pdf.setFont(
        "Helvetica",
        10
    )

    pdf.drawString(
        50,
        height - 112,
        "AI Career Intelligence"
    )

    pdf.setFont(
        "Helvetica",
        9
    )

    pdf.drawRightString(
        width - 50,
        height - 60,
        "INTERVIEW ASSESSMENT"
    )

    pdf.drawRightString(
        width - 50,
        height - 78,
        report_date
    )

    # ==================================================
    # SCORE CARD
    # ==================================================

    y = height - 180

    pdf.setFillColor(light_gray)

    pdf.roundRect(
        50,
        y - 125,
        width - 100,
        125,
        12,
        fill=1,
        stroke=0
    )

    pdf.setFillColor(gray)

    pdf.setFont(
        "Helvetica",
        10
    )

    pdf.drawString(
        70,
        y - 28,
        "OVERALL PERFORMANCE"
    )

    pdf.setFillColor(dark)

    pdf.setFont(
        "Helvetica-Bold",
        30
    )

    pdf.drawString(
        70,
        y - 65,
        f"{score:.1f}/10"
    )

    # Rating badge

    pdf.setFillColor(rating_color)

    pdf.roundRect(
        190,
        y - 70,
        135,
        28,
        14,
        fill=1,
        stroke=0
    )

    pdf.setFillColor(colors.white)

    pdf.setFont(
        "Helvetica-Bold",
        10
    )

    pdf.drawCentredString(
        257,
        y - 60,
        rating
    )

    # Score bar

    bar_x = 70
    bar_y = y - 100
    bar_width = width - 140
    bar_height = 13

    pdf.setFillColor(border)

    pdf.roundRect(
        bar_x,
        bar_y,
        bar_width,
        bar_height,
        6,
        fill=1,
        stroke=0
    )

    pdf.setFillColor(accent)

    progress_width = (
        bar_width *
        min(max(score, 0), 10) /
        10
    )

    pdf.roundRect(
        bar_x,
        bar_y,
        progress_width,
        bar_height,
        6,
        fill=1,
        stroke=0
    )

    y -= 160

    # ==================================================
    # CANDIDATE INFORMATION
    # ==================================================

    y = draw_section_title(
        "Candidate Information",
        y
    )

    pdf.setFillColor(light)

    pdf.roundRect(
        50,
        y - 82,
        width - 100,
        82,
        10,
        fill=1,
        stroke=0
    )

    pdf.setFillColor(dark)

    pdf.setFont(
        "Helvetica-Bold",
        10
    )

    pdf.drawString(
        70,
        y - 25,
        "USER ID"
    )

    pdf.drawString(
        300,
        y - 25,
        "RECOMMENDED CAREER"
    )

    pdf.setFont(
        "Helvetica",
        11
    )

    pdf.drawString(
        70,
        y - 48,
        str(result.user_id)
    )

    pdf.drawString(
        300,
        y - 48,
        str(result.career)
    )

    pdf.setFont(
        "Helvetica-Bold",
        10
    )

    pdf.drawString(
        70,
        y - 68,
        "INTERVIEW DATE"
    )

    pdf.setFont(
        "Helvetica",
        10
    )

    pdf.drawString(
        70,
        y - 82,
        report_date
    )

    y -= 115

    # ==================================================
    # INTERVIEW STATISTICS
    # ==================================================

    y = draw_section_title(
        "Interview Statistics",
        y
    )

    card_width = (
        (width - 120) / 3
    )

    stats = [
        (
            "QUESTIONS",
            str(result.questions_answered)
        ),
        (
            "AVERAGE SCORE",
            f"{score:.1f}/10"
        ),
        (
            "FACE WARNINGS",
            str(result.face_warnings)
        )
    ]

    for i, (label, value) in enumerate(stats):

        x = (
            50 +
            i * (card_width + 10)
        )

        pdf.setFillColor(colors.white)

        pdf.roundRect(
            x,
            y - 65,
            card_width,
            65,
            10,
            fill=1,
            stroke=1
        )

        pdf.setStrokeColor(border)

        pdf.setFillColor(gray)

        pdf.setFont(
            "Helvetica",
            8
        )

        pdf.drawCentredString(
            x + card_width / 2,
            y - 22,
            label
        )

        pdf.setFillColor(dark)

        pdf.setFont(
            "Helvetica-Bold",
            17
        )

        pdf.drawCentredString(
            x + card_width / 2,
            y - 48,
            value
        )

    y -= 95

    # ==================================================
    # FACE MONITORING
    # ==================================================

    y = draw_section_title(
        "Face Monitoring",
        y
    )

    if result.face_warnings == 0:

        monitoring_text = (
            "Excellent — face was visible throughout "
            "the interview."
        )

        monitoring_color = green

    else:

        monitoring_text = (
            f"Face monitoring recorded "
            f"{result.face_warnings} warning(s)."
        )

        monitoring_color = orange

    pdf.setFillColor(
        HexColor("#F8FAFC")
    )

    pdf.roundRect(
        50,
        y - 55,
        width - 100,
        55,
        10,
        fill=1,
        stroke=0
    )

    pdf.setFillColor(
        monitoring_color
    )

    pdf.circle(
        75,
        y - 28,
        7,
        fill=1,
        stroke=0
    )

    draw_wrapped_text(
        monitoring_text,
        92,
        y - 32,
        width - 170,
        size=10
    )

    y -= 85

    # ==================================================
    # STRENGTHS
    # ==================================================

    if y < 150:
        y = new_page()

    y = draw_section_title(
        "Key Strengths",
        y
    )

    strengths = (
        result.strengths
        or "No strengths recorded."
    )

    for item in strengths.split(", "):

        if y < 70:

            y = new_page()

            y = draw_section_title(
                "Key Strengths",
                y
            )

        pdf.setFillColor(
            HexColor("#F0FDF4")
        )

        pdf.roundRect(
            50,
            y - 32,
            width - 100,
            32,
            8,
            fill=1,
            stroke=0
        )

        pdf.setFillColor(green)

        pdf.circle(
            68,
            y - 16,
            5,
            fill=1,
            stroke=0
        )

        y = draw_wrapped_text(
            item,
            82,
            y - 20,
            width - 145,
            size=9
        )

        y -= 8

    # ==================================================
    # IMPROVEMENTS
    # ==================================================

    if y < 150:

        y = new_page()

    y -= 10

    y = draw_section_title(
        "Areas to Improve",
        y
    )

    improvements = (
        result.improvements
        or "No improvements recorded."
    )

    for item in improvements.split(", "):

        if y < 70:

            y = new_page()

            y = draw_section_title(
                "Areas to Improve",
                y
            )

        pdf.setFillColor(
            HexColor("#FFF7ED")
        )

        pdf.roundRect(
            50,
            y - 32,
            width - 100,
            32,
            8,
            fill=1,
            stroke=0
        )

        pdf.setFillColor(orange)

        pdf.circle(
            68,
            y - 16,
            5,
            fill=1,
            stroke=0
        )

        y = draw_wrapped_text(
            item,
            82,
            y - 20,
            width - 145,
            size=9
        )

        y -= 8

    # ==================================================
    # OVERALL RECOMMENDATION
    # ==================================================

    if y < 150:

        y = new_page()

    y -= 15

    y = draw_section_title(
        "Overall Recommendation",
        y
    )

    if score >= 8:

        recommendation = (
            "Excellent interview performance. "
            "You demonstrated strong communication "
            "and technical understanding. Continue "
            "building advanced skills and practical "
            "experience."
        )

    elif score >= 6:

        recommendation = (
            "Good interview performance with clear "
            "potential. Focus on technical depth, "
            "structured answers, and practical examples "
            "to improve further."
        )

    else:

        recommendation = (
            "Continue practicing interview questions. "
            "Focus on providing structured answers, "
            "adding technical details, and supporting "
            "your explanations with practical examples."
        )

    pdf.setFillColor(light)

    pdf.roundRect(
        50,
        y - 90,
        width - 100,
        90,
        10,
        fill=1,
        stroke=0
    )

    pdf.setFillColor(accent)

    pdf.setFont(
        "Helvetica-Bold",
        11
    )

    pdf.drawString(
        70,
        y - 25,
        "AI FEEDBACK"
    )

    draw_wrapped_text(
        recommendation,
        70,
        y - 48,
        width - 140,
        size=9,
        leading=15
    )

    # ==================================================
    # FOOTER
    # ==================================================

    draw_footer()

    pdf.save()

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=file_name
    )
@app.get("/career-recommendations/{user_id}")
def career_recommendations(user_id: int, db: Session = Depends(get_db)):

    profile = (
        db.query(models.CareerProfile)
        .filter(models.CareerProfile.user_id == user_id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Career profile not found"
        )

    recommendations = get_multiple_career_recommendations(
        skills=profile.skills,
        interests=profile.interests,
        education=profile.education,
        experience=profile.experience
    )

    return {
        "user_id": user_id,
        "recommendations": recommendations
    }
@app.get("/career-readiness/{user_id}")
def career_readiness(user_id: int, db: Session = Depends(get_db)):

    profile = (
        db.query(models.CareerProfile)
        .filter(models.CareerProfile.user_id == user_id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Career profile not found"
        )

    # -----------------------------
    # SKILL SCORE
    # -----------------------------

    skills = profile.skills or ""

    skill_list = [
        skill.strip()
        for skill in skills.split(",")
        if skill.strip()
    ]

    skill_score = min(len(skill_list) * 10, 100)

    # -----------------------------
    # EXPERIENCE SCORE
    # -----------------------------

    experience = (profile.experience or "").lower()

    if "intern" in experience:
        experience_score = 80
    elif "experience" in experience:
        experience_score = 90
    elif "fresher" in experience:
        experience_score = 50
    else:
        experience_score = 40

    # -----------------------------
    # PROJECT / PROFILE SCORE
    # -----------------------------

    profile_score = 0

    if profile.education:
        profile_score += 25

    if profile.interests:
        profile_score += 25

    if profile.skills:
        profile_score += 50

    # -----------------------------
    # FINAL SCORE
    # -----------------------------

    readiness_score = round(
        (skill_score * 0.45) +
        (experience_score * 0.25) +
        (profile_score * 0.30)
    )

    # -----------------------------
    # LEVEL
    # -----------------------------

    if readiness_score >= 80:
        level = "Highly Ready"
    elif readiness_score >= 60:
        level = "Career Ready"
    elif readiness_score >= 40:
        level = "Developing"
    else:
        level = "Beginner"

    return {
        "user_id": user_id,
        "career_readiness_score": readiness_score,
        "level": level,
        "breakdown": {
            "skills": skill_score,
            "experience": experience_score,
            "profile": profile_score
        }
    }
@app.get("/career-readiness/{user_id}")
def career_readiness(user_id: int, db: Session = Depends(get_db)):

    # Get career profile
    profile = (
        db.query(models.CareerProfile)
        .filter(models.CareerProfile.user_id == user_id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Career profile not found"
        )

    # ------------------------------------------------
    # 1. SKILL SCORE - 30%
    # ------------------------------------------------

    skills = profile.skills or ""

    skill_list = [
        skill.strip()
        for skill in skills.split(",")
        if skill.strip()
    ]

    skill_score = min(len(skill_list) * 12, 100)


    # ------------------------------------------------
    # 2. INTERVIEW SCORE - 25%
    # ------------------------------------------------

    interviews = (
        db.query(models.InterviewResult)
        .filter(models.InterviewResult.user_id == user_id)
        .all()
    )

    if interviews:
        interview_score = sum(
            interview.average_score
            for interview in interviews
        ) / len(interviews)

        # Convert 0-10 score to 0-100
        interview_score = min(
            round(interview_score * 10),
            100
        )
    else:
        interview_score = 0


    # ------------------------------------------------
    # 3. LEARNING PROGRESS - 20%
    # ------------------------------------------------

    learning_score = 0

    if profile.skills:
        learning_score += 40

    if profile.interests:
        learning_score += 20

    if profile.recommended_career:
        learning_score += 40

    learning_score = min(learning_score, 100)


    # ------------------------------------------------
    # 4. PROJECT / EXPERIENCE SCORE - 15%
    # ------------------------------------------------

    experience = (profile.experience or "").lower()

    if "project" in experience:
        project_score = 100
    elif "intern" in experience:
        project_score = 80
    elif "experience" in experience:
        project_score = 70
    elif "fresher" in experience:
        project_score = 40
    else:
        project_score = 30


    # ------------------------------------------------
    # 5. PROFILE COMPLETENESS - 10%
    # ------------------------------------------------

    profile_score = 0

    if profile.skills:
        profile_score += 30

    if profile.education:
        profile_score += 25

    if profile.experience:
        profile_score += 20

    if profile.interests:
        profile_score += 25

    profile_score = min(profile_score, 100)


    # ------------------------------------------------
    # FINAL CAREER READINESS SCORE
    # ------------------------------------------------

    readiness_score = round(
        (skill_score * 0.30) +
        (interview_score * 0.25) +
        (learning_score * 0.20) +
        (project_score * 0.15) +
        (profile_score * 0.10)
    )


    # ------------------------------------------------
    # READINESS LEVEL
    # ------------------------------------------------

    if readiness_score >= 85:
        level = "Excellent"
    elif readiness_score >= 70:
        level = "Career Ready"
    elif readiness_score >= 50:
        level = "Developing"
    else:
        level = "Beginner"


    return {
        "user_id": user_id,
        "career_readiness_score": readiness_score,
        "level": level,
        "breakdown": {
            "skills": skill_score,
            "interview": interview_score,
            "learning": learning_score,
            "projects": project_score,
            "profile": profile_score
        }
    }
@app.get("/career-readiness-analysis/{user_id}")
def career_readiness_analysis(
    user_id: int,
    db: Session = Depends(get_db)
):

    profile = (
        db.query(models.CareerProfile)
        .filter(models.CareerProfile.user_id == user_id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Career profile not found"
        )

    recommendations = get_multiple_career_recommendations(
        skills=profile.skills,
        interests=profile.interests,
        education=profile.education,
        experience=profile.experience
    )

    analysis = []

    for recommendation in recommendations:

        career = recommendation["career"]

        result = get_career_readiness_analysis(
            skills=profile.skills,
            interests=profile.interests,
            education=profile.education,
            experience=profile.experience,
            career=career
        )

        analysis.append(result)

    return {
        "user_id": user_id,
        "career_analysis": analysis
    }
@app.get("/career-gap-action-plan/{user_id}")
def career_gap_action_plan(user_id: int, db: Session = Depends(get_db)):

    profile = (
        db.query(models.CareerProfile)
        .filter(models.CareerProfile.user_id == user_id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Career profile not found"
        )

    # Get career recommendations
    recommendations = get_multiple_career_recommendations(
        skills=profile.skills,
        interests=profile.interests,
        education=profile.education,
        experience=profile.experience
    )

    if not recommendations:
        raise HTTPException(
            status_code=404,
            detail="No career recommendations found"
        )

    # Use the highest-ranked career
    selected_career = recommendations[0]["career"]

    # Generate career gap and action plan
    action_plan = get_career_gap_action_plan(
        skills=profile.skills,
        interests=profile.interests,
        education=profile.education,
        experience=profile.experience,
        career=selected_career
    )

    # Get interview performance
    interviews = (
        db.query(models.InterviewResult)
        .filter(models.InterviewResult.user_id == user_id)
        .all()
    )

    if interviews:
        average_interview_score = round(
            sum(i.average_score for i in interviews)
            / len(interviews),
            2
        )

        interview_score = min(
            round(average_interview_score * 10),
            100
        )

        interview_gap = max(0, 100 - interview_score)

        if interview_score >= 80:
            interview_action = (
                "Your interview performance is strong. "
                "Focus on advanced technical and behavioral questions."
            )
        elif interview_score >= 60:
            interview_action = (
                "Improve interview performance by giving more "
                "detailed explanations and practical examples."
            )
        else:
            interview_action = (
                "Practice mock interviews regularly and strengthen "
                "your technical explanations."
            )

    else:
        average_interview_score = 0
        interview_score = 0
        interview_gap = 100

        interview_action = (
            "Complete a mock interview to evaluate your "
            "interview readiness."
        )

    return {
        "user_id": user_id,
        "selected_career": selected_career,

        "career_gap": action_plan,

        "interview_analysis": {
            "average_score": average_interview_score,
            "interview_score": interview_score,
            "interview_gap": interview_gap,
            "recommended_action": interview_action
        },

        "next_steps": [
            f"Learn {skill}"
            for skill in action_plan["priority_skills"]
        ]
    }