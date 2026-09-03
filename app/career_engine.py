def recommend_career(skills, interests):
    skills = skills.lower()
    interests = interests.lower()

    recommendations = []

    if any(skill in skills for skill in ["python", "machine learning", "tensorflow", "pytorch"]):
        recommendations.append("Machine Learning Engineer")

    if any(skill in skills for skill in ["python", "fastapi", "django", "flask", "api"]):
        recommendations.append("Backend Developer")

    if any(skill in skills for skill in ["html", "css", "javascript", "react"]):
        recommendations.append("Frontend Developer")

    if any(skill in skills for skill in ["sql", "postgresql", "mysql", "database"]):
        recommendations.append("Database Developer")

    if any(word in interests for word in ["artificial intelligence", "ai", "machine learning"]):
        recommendations.append("AI Engineer")

    if any(word in interests for word in ["web development", "web"]):
        recommendations.append("Full Stack Developer")

    if not recommendations:
        recommendations.append("Software Developer")

    return list(dict.fromkeys(recommendations))
def analyze_skill_gap(skills, career):
    skills = skills.lower()

    career_skills = {
        "Machine Learning Engineer": [
            "python",
            "machine learning",
            "tensorflow",
            "pytorch",
            "statistics"
        ],

        "Backend Developer": [
            "python",
            "fastapi",
            "django",
            "rest api",
            "sql",
            "postgresql"
        ],

        "Frontend Developer": [
            "html",
            "css",
            "javascript",
            "react"
        ],

        "Database Developer": [
            "sql",
            "postgresql",
            "mysql",
            "database"
        ],

        "AI Engineer": [
            "python",
            "machine learning",
            "deep learning",
            "tensorflow",
            "pytorch"
        ],

        "Full Stack Developer": [
            "html",
            "css",
            "javascript",
            "react",
            "python",
            "sql"
        ],

        "Software Developer": [
            "python",
            "programming",
            "data structures",
            "algorithms"
        ]
    }

    required_skills = career_skills.get(career, [])

    user_skills = [
        skill.strip()
        for skill in skills.split(",")
    ]

    matched_skills = []
    missing_skills = []

    for skill in required_skills:
        if skill in user_skills:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    return {
        "career": career,
        "required_skills": required_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills
    }
def learning_roadmap(missing_skills):
    roadmap = {
        "python": [
            "Learn Python fundamentals",
            "Practice functions, loops and data structures",
            "Build small Python projects"
        ],

        "machine learning": [
            "Learn supervised and unsupervised learning",
            "Study regression and classification",
            "Build a machine learning project"
        ],

        "tensorflow": [
            "Learn TensorFlow basics",
            "Build neural networks",
            "Train and evaluate a deep learning model"
        ],

        "pytorch": [
            "Learn PyTorch fundamentals",
            "Build neural networks",
            "Train a deep learning model"
        ],

        "statistics": [
            "Learn probability fundamentals",
            "Study descriptive statistics",
            "Learn statistical concepts used in machine learning"
        ],

        "fastapi": [
            "Learn FastAPI basics",
            "Create REST APIs",
            "Connect FastAPI with PostgreSQL"
        ],

        "django": [
            "Learn Django fundamentals",
            "Learn Django models and views",
            "Build a Django web application"
        ],

        "rest api": [
            "Understand REST architecture",
            "Learn HTTP methods and status codes",
            "Build and test REST APIs"
        ],

        "sql": [
            "Learn SQL fundamentals",
            "Practice SELECT, JOIN and GROUP BY",
            "Solve SQL problems"
        ],

        "postgresql": [
            "Learn PostgreSQL basics",
            "Practice database design",
            "Connect PostgreSQL with a backend application"
        ],

        "html": [
            "Learn HTML structure",
            "Create forms and semantic webpages",
            "Build a responsive webpage"
        ],

        "css": [
            "Learn CSS fundamentals",
            "Practice Flexbox and Grid",
            "Create responsive designs"
        ],

        "javascript": [
            "Learn JavaScript fundamentals",
            "Practice DOM manipulation",
            "Build interactive web applications"
        ],

        "react": [
            "Learn React fundamentals",
            "Learn components and state",
            "Build a React project"
        ],

        "deep learning": [
            "Learn neural networks",
            "Study CNNs and RNNs",
            "Build a deep learning project"
        ],

        "database": [
            "Learn database fundamentals",
            "Study relational databases",
            "Practice database design"
        ]
    }

    result = []

    for skill in missing_skills:
        if skill in roadmap:
            result.append({
                "skill": skill,
                "steps": roadmap[skill]
            })

    return result
def get_interview_questions(career):
    interview_questions = {

        "Machine Learning Engineer": [
            "What is machine learning?",
            "What is the difference between supervised and unsupervised learning?",
            "What is overfitting and how can you prevent it?",
            "What is the difference between classification and regression?",
            "What is the purpose of TensorFlow or PyTorch?"
        ],

        "Backend Developer": [
            "What is a REST API?",
            "What is the difference between GET and POST?",
            "What is FastAPI?",
            "What is the difference between SQL and NoSQL databases?",
            "How does a backend application communicate with a database?"
        ],

        "Frontend Developer": [
            "What is HTML?",
            "What is the difference between CSS and JavaScript?",
            "What is responsive web design?",
            "What is React?",
            "What is the difference between state and props in React?"
        ],

        "Database Developer": [
            "What is a database?",
            "What is SQL?",
            "What is a primary key?",
            "What is a foreign key?",
            "What is database normalization?"
        ],

        "AI Engineer": [
            "What is artificial intelligence?",
            "What is the difference between AI and machine learning?",
            "What is deep learning?",
            "What are neural networks?",
            "What are some real-world applications of AI?"
        ],

        "Full Stack Developer": [
            "What is the difference between frontend and backend development?",
            "What is a REST API?",
            "How does a frontend communicate with a backend?",
            "What is JavaScript?",
            "What is a database?"
        ],

        "Software Developer": [
            "What is object-oriented programming?",
            "What are data structures?",
            "What is an algorithm?",
            "What is the difference between a class and an object?",
            "What is version control?"
        ]
    }

    return interview_questions.get(
        career,
        [
            "Tell me about yourself.",
            "What are your technical skills?",
            "Why are you interested in this career?",
            "Describe one of your projects.",
            "What are your career goals?"
        ]
    )
def evaluate_interview_answer(question, answer, career):

    answer = answer.strip()

    if not answer:
        return {
            "score": 0,
            "feedback": "No answer was provided.",
            "strengths": [],
            "areas_to_improve": ["Provide a complete answer."]
        }

    answer_length = len(answer.split())

    if answer_length < 10:
        score = 3
        feedback = "Your answer is too short. Try to explain the concept with more detail."
        strengths = ["You attempted the question."]
        improvements = [
            "Give a more detailed explanation.",
            "Include an example."
        ]

    elif answer_length < 30:
        score = 6
        feedback = "Your answer is reasonable but could be explained in more depth."
        strengths = [
            "You provided a basic explanation."
        ]
        improvements = [
            "Add more technical details.",
            "Include a practical example."
        ]

    else:
        score = 8
        feedback = "Good answer. You provided sufficient explanation."
        strengths = [
            "Good level of explanation.",
            "Answer demonstrates understanding."
        ]
        improvements = [
            "Use more technical examples.",
            "Explain the concept more precisely."
        ]

    return {
        "score": score,
        "feedback": feedback,
        "strengths": strengths,
        "areas_to_improve": improvements
    }
# app/career_engine.py

CAREER_KEYWORDS = {
    "Machine Learning Engineer": [
        "python", "machine learning", "ml", "tensorflow",
        "pytorch", "scikit-learn", "numpy", "pandas"
    ],

    "AI Engineer": [
        "python", "artificial intelligence", "ai",
        "machine learning", "deep learning", "nlp",
        "tensorflow", "pytorch"
    ],

    "Data Scientist": [
        "python", "sql", "statistics", "pandas",
        "numpy", "machine learning", "data analysis"
    ],

    "Backend Developer": [
        "python", "java", "node", "sql",
        "api", "fastapi", "django", "backend"
    ],

    "Frontend Developer": [
        "html", "css", "javascript", "react",
        "frontend", "typescript"
    ],

    "Full Stack Developer": [
        "html", "css", "javascript", "react",
        "python", "node", "sql", "api"
    ],

    "Database Developer": [
        "sql", "postgresql", "mysql",
        "database", "mongodb"
    ]
}


def get_multiple_career_recommendations(
    skills,
    interests="",
    education="",
    experience=""
):
    """
    Generate ranked career recommendations.
    """

    skills_text = skills.lower() if skills else ""
    interests_text = interests.lower() if interests else ""
    education_text = education.lower() if education else ""
    experience_text = experience.lower() if experience else ""

    results = []

    for career, keywords in CAREER_KEYWORDS.items():

        skill_matches = 0
        interest_matches = 0

        matched_skills = []

        for keyword in keywords:

            if keyword in skills_text:
                skill_matches += 1
                matched_skills.append(keyword)

            if keyword in interests_text:
                interest_matches += 1

        total_keywords = len(keywords)

        skill_score = (
            skill_matches / total_keywords
        ) * 70

        interest_score = (
            interest_matches / total_keywords
        ) * 20

        education_score = 5 if "computer" in education_text else 0

        experience_score = 5 if experience_text and experience_text != "fresher" else 0

        final_score = (
            skill_score +
            interest_score +
            education_score +
            experience_score
        )

        final_score = min(round(final_score), 100)

        results.append({
            "career": career,
            "match_percentage": final_score,
            "matched_skills": matched_skills
        })

    results.sort(
        key=lambda x: x["match_percentage"],
        reverse=True
    )

    return results
def get_career_readiness_analysis(
    skills,
    interests,
    education,
    experience,
    career
):
    skills_text = (skills or "").lower()
    interests_text = (interests or "").lower()

    career_keywords = CAREER_KEYWORDS.get(career, [])

    matched_skills = []
    missing_skills = []

    for keyword in career_keywords:

        if keyword in skills_text:
            matched_skills.append(keyword)
        else:
            missing_skills.append(keyword)

    # Skill readiness
    if career_keywords:
        skill_score = round(
            (len(matched_skills) / len(career_keywords)) * 100
        )
    else:
        skill_score = 0

    # Interest match
    interest_matches = sum(
        1
        for keyword in career_keywords
        if keyword in interests_text
    )

    if career_keywords:
        interest_score = round(
            (interest_matches / len(career_keywords)) * 100
        )
    else:
        interest_score = 0

    # Education
    education_score = 100 if education else 0

    # Experience
    experience_text = (experience or "").lower()

    if "intern" in experience_text:
        experience_score = 80
    elif "experience" in experience_text:
        experience_score = 90
    elif "project" in experience_text:
        experience_score = 70
    elif "fresher" in experience_text:
        experience_score = 40
    else:
        experience_score = 30

    # Final readiness score
    readiness_score = round(
        (skill_score * 0.50) +
        (interest_score * 0.20) +
        (education_score * 0.10) +
        (experience_score * 0.20)
    )

    readiness_score = min(readiness_score, 100)

    # Readiness level
    if readiness_score >= 85:
        level = "Excellent Match"
    elif readiness_score >= 70:
        level = "Strong Match"
    elif readiness_score >= 50:
        level = "Moderate Match"
    else:
        level = "Needs Improvement"

    return {
        "career": career,
        "readiness_score": readiness_score,
        "level": level,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "skill_score": skill_score,
        "interest_score": interest_score,
        "education_score": education_score,
        "experience_score": experience_score
    }
def get_career_gap_action_plan(
    skills,
    interests="",
    education="",
    experience="",
    career=""
):
    """
    Generates a personalized career gap and action plan.
    """

    # Get required skills for the selected career
    required_skills = CAREER_KEYWORDS.get(career, [])

    # Convert user skills into a clean list
    user_skills = [
        skill.strip().lower()
        for skill in (skills or "").split(",")
        if skill.strip()
    ]

    # Find matched and missing skills
    matched_skills = []
    missing_skills = []

    for required in required_skills:
        if any(
            required.lower() in user_skill
            or user_skill in required.lower()
            for user_skill in user_skills
        ):
            matched_skills.append(required)
        else:
            missing_skills.append(required)

    # Calculate skill gap
    if required_skills:
        skill_score = round(
            (len(matched_skills) / len(required_skills)) * 100
        )
    else:
        skill_score = 0

    # Prioritize the first few missing skills
    priority_skills = missing_skills[:3]

    # Generate recommended action
    if missing_skills:
        recommended_action = (
            f"Focus on learning {priority_skills[0]} first "
            "and build a practical project using it."
        )
    elif matched_skills:
        recommended_action = (
            "Your core skills match this career. "
            "Focus on advanced projects and interview preparation."
        )
    else:
        recommended_action = (
            "Start with the fundamental skills required for this career."
        )

    # Generate project recommendation
    if career == "Machine Learning Engineer":
        project = "Build an ML prediction project using Python and scikit-learn."
    elif career == "AI Engineer":
        project = "Build an AI application using Python and an ML/AI framework."
    elif career == "Data Scientist":
        project = "Build a data analysis and prediction project using Python, Pandas and SQL."
    elif career == "Backend Developer":
        project = "Build a REST API using FastAPI or Django with PostgreSQL."
    elif career == "Frontend Developer":
        project = "Build a responsive web application using HTML, CSS and JavaScript."
    elif career == "Full Stack Developer":
        project = "Build a complete web application with frontend, backend and database."
    elif career == "Database Developer":
        project = "Build a database-driven application using SQL and PostgreSQL."
    else:
        project = "Build a practical software project related to your target career."

    # Expected improvement
    if missing_skills:
        expected_improvement = min(
            100,
            skill_score + len(priority_skills) * 10
        )
    else:
        expected_improvement = min(100, skill_score + 10)

    return {
        "career": career,
        "skill_score": skill_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "priority_skills": priority_skills,
        "recommended_action": recommended_action,
        "recommended_project": project,
        "expected_improvement": expected_improvement
    }