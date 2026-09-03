const API_BASE = "http://127.0.0.1:8000";


// ==========================================
// USER ID
// ==========================================

const params = new URLSearchParams(window.location.search);

const userId =
    params.get("user_id") ||
    localStorage.getItem("user_id") ||
    "1";

localStorage.setItem("user_id", userId);


// ==========================================
// GLOBAL DATA
// ==========================================

let profileData = null;
let careerData = [];
let readinessData = null;
let actionPlanData = null;

let careerChart = null;


// ==========================================
// INITIAL LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadCareerAnalysis();

});


// ==========================================
// MAIN LOADER
// ==========================================

async function loadCareerAnalysis() {

    try {

        showLoading();

        const [
            profile,
            careers,
            readiness,
            actionPlan
        ] = await Promise.all([

            fetchJSON(`/career-profile/${userId}`),

            fetchJSON(`/career-recommendations/${userId}`),

            fetchJSON(`/career-readiness/${userId}`),

            fetchJSON(`/career-gap-action-plan/${userId}`)

        ]);


        profileData = profile;

        careerData = normalizeCareers(careers);

        readinessData = readiness;

        actionPlanData = actionPlan;


        renderProfile(profile);

        renderCareers(careerData);

        renderSkillAnalysis(
            profile,
            actionPlan
        );

        renderReadiness(readiness);

        renderInsights(
            profile,
            careerData,
            readiness,
            actionPlan
        );


    } catch (error) {

        console.error(error);

        showError(
            "Unable to load career analysis. Make sure FastAPI is running."
        );

    }

}


// ==========================================
// FETCH
// ==========================================

async function fetchJSON(endpoint) {

    const response =
        await fetch(API_BASE + endpoint);

    if (!response.ok) {

        throw new Error(
            `API Error ${response.status}: ${endpoint}`
        );

    }

    return response.json();

}


// ==========================================
// PROFILE
// ==========================================

function renderProfile(profile) {

    if (!profile) return;


    const skills =
        profile.skills || "Not provided";

    const education =
        profile.education || "Not provided";

    const experience =
        profile.experience || "Fresher";

    const interests =
        profile.interests || "Not provided";


    document.getElementById("skillsValue")
        .textContent = skills;

    document.getElementById("educationValue")
        .textContent = education;

    document.getElementById("experienceValue")
        .textContent = experience;

    document.getElementById("interestsValue")
        .textContent = interests;

}


// ==========================================
// NORMALIZE CAREERS
// ==========================================

function normalizeCareers(data) {

    let careers = [];

    if (Array.isArray(data)) {

        careers = data;

    } else if (data?.recommendations) {

        careers = data.recommendations;

    } else if (data?.careers) {

        careers = data.careers;

    }


    return careers.map(item => {

        const name =
            item.career ||
            item.career_name ||
            item.name ||
            item.title ||
            "Career";


        let percentage =
            item.match_percentage ??
            item.matchPercentage ??
            item.percentage ??
            item.score ??
            0;


        if (percentage <= 1) {
            percentage *= 100;
        }


        return {

            name: name,

            percentage: Math.round(
                Math.min(100, percentage)
            )

        };

    });

}


// ==========================================
// CAREER RENDER
// ==========================================

function renderCareers(careers) {

    const list =
        document.getElementById("careerList");


    if (!careers.length) {

        list.innerHTML = `
            <div class="loading">
                No career recommendations found.
            </div>
        `;

        return;

    }


    // Sort highest first

    careers.sort(
        (a,b) =>
            b.percentage - a.percentage
    );


    const top =
        careers[0];


    // HERO

    document.getElementById("topCareer")
        .textContent = top.name;

    document.getElementById("topMatch")
        .textContent = `${top.percentage}%`;


    document.getElementById("careerDescription")
        .textContent =
        `Your current profile shows a ${top.percentage}% compatibility with ${top.name}. Focus on the recommended skills and practical experience to improve your career readiness.`;


    // LIST

    list.innerHTML = careers
        .slice(0, 6)
        .map((career, index) => `

            <div class="career-item">

                <div class="career-head">

                    <span class="career-name">
                        ${index + 1}. ${escapeHTML(career.name)}
                    </span>

                    <span class="career-percent">
                        ${career.percentage}%
                    </span>

                </div>

                <div class="career-bar">

                    <div
                        class="career-fill"
                        style="width:${career.percentage}%"
                    ></div>

                </div>

            </div>

        `)
        .join("");


    renderCareerChart(careers);

}


// ==========================================
// CAREER CHART
// ==========================================

function renderCareerChart(careers) {

    const canvas =
        document.getElementById("careerChart");


    if (careerChart) {

        careerChart.destroy();

    }


    careerChart = new Chart(
        canvas,
        {

            type: "bar",

            data: {

                labels:
                    careers
                        .slice(0, 6)
                        .map(c => c.name),

                datasets: [{

                    label: "Career Match %",

                    data:
                        careers
                            .slice(0, 6)
                            .map(c => c.percentage),

                    borderRadius: 8,

                    backgroundColor:
                        "rgba(124,92,255,.75)"

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    }

                },

                scales: {

                    x: {

                        ticks: {
                            color: "#8d98b5"
                        },

                        grid: {
                            display: false
                        }

                    },

                    y: {

                        beginAtZero: true,

                        max: 100,

                        ticks: {
                            color: "#8d98b5"
                        },

                        grid: {
                            color:
                                "rgba(255,255,255,.06)"
                        }

                    }

                }

            }

        }
    );

}


// ==========================================
// SKILL ANALYSIS
// ==========================================

function renderSkillAnalysis(
    profile,
    actionPlan
) {

    // CURRENT SKILLS

    const skillsText =
        profile?.skills || "";

    const skills =
        skillsText
            .split(",")
            .map(skill => skill.trim())
            .filter(Boolean);


    const strengthContainer =
        document.getElementById(
            "strengthSkills"
        );


    if (skills.length) {

        strengthContainer.innerHTML =
            skills.map(skill => `

                <span class="skill-tag">
                    ${escapeHTML(skill)}
                </span>

            `).join("");

    } else {

        strengthContainer.innerHTML =
            `<span class="loading">
                No skills added yet.
            </span>`;

    }


    // PRIORITY SKILLS

    let priorities = [];


    if (Array.isArray(actionPlan)) {

        priorities = actionPlan;

    } else if (actionPlan?.priority_skills) {

        priorities =
            actionPlan.priority_skills;

    } else if (actionPlan?.missing_skills) {

        priorities =
            actionPlan.missing_skills;

    } else if (actionPlan?.skills) {

        priorities =
            actionPlan.skills;

    }


    if (!Array.isArray(priorities)) {

        priorities = [];

    }


    const container =
        document.getElementById(
            "prioritySkills"
        );


    if (!priorities.length) {

        container.innerHTML = `
            <div class="loading">
                Your profile has no major skill gaps detected.
            </div>
        `;

        return;

    }


    container.innerHTML =
        priorities
            .slice(0, 8)
            .map((skill, index) => {

                const name =
                    typeof skill === "string"
                        ? skill
                        : (
                            skill.skill ||
                            skill.name ||
                            "Skill"
                        );


                const priority =
                    typeof skill === "object"
                        ? (
                            skill.priority ||
                            skill.importance ||
                            80 - index * 5
                        )
                        : 80 - index * 5;


                return `

                    <div class="priority-item">

                        <div class="priority-top">

                            <strong>
                                ${escapeHTML(name)}
                            </strong>

                            <span>
                                Priority
                            </span>

                        </div>

                        <div class="priority-bar">

                            <div
                                class="priority-fill"
                                style="width:${priority}%"
                            ></div>

                        </div>

                    </div>

                `;

            })
            .join("");

}


// ==========================================
// READINESS
// ==========================================

function renderReadiness(data) {

    if (!data) return;


    const score = Math.round(

        data.readiness_score ??
        data.career_readiness ??
        data.score ??
        data.overall_score ??
        0

    );


    document.getElementById(
        "readinessScore"
    ).textContent = score;


    let level = "Needs Improvement";


    if (score >= 80) {

        level = "Excellent";

    } else if (score >= 65) {

        level = "Career Ready";

    } else if (score >= 50) {

        level = "Developing";

    }


    document.getElementById(
        "readinessLevel"
    ).textContent = level;


    const skills =
        getReadinessValue(
            data,
            [
                "skill_score",
                "skills_score",
                "skill_readiness"
            ]
        );


    const experience =
        getReadinessValue(
            data,
            [
                "experience_score",
                "experience_readiness"
            ]
        );


    const interview =
        getReadinessValue(
            data,
            [
                "interview_score",
                "interview_readiness"
            ]
        );


    const profile =
        getReadinessValue(
            data,
            [
                "profile_score",
                "profile_completeness"
            ]
        );


    setReadinessBar(
        "skillScore",
        "skillProgress",
        skills
    );

    setReadinessBar(
        "experienceScore",
        "experienceProgress",
        experience
    );

    setReadinessBar(
        "interviewScore",
        "interviewProgress",
        interview
    );

    setReadinessBar(
        "profileScore",
        "profileProgress",
        profile
    );

}


function getReadinessValue(
    data,
    keys
) {

    for (const key of keys) {

        if (
            data[key] !== undefined &&
            data[key] !== null
        ) {

            let value =
                Number(data[key]);

            if (value <= 1) {
                value *= 100;
            }

            return Math.round(
                Math.min(100, value)
            );

        }

    }

    return 0;

}


function setReadinessBar(
    labelId,
    progressId,
    value
) {

    document.getElementById(labelId)
        .textContent = `${value}%`;

    setTimeout(() => {

        document.getElementById(progressId)
            .style.width = `${value}%`;

    }, 100);

}


// ==========================================
// AI INSIGHTS
// ==========================================

function renderInsights(
    profile,
    careers,
    readiness,
    actionPlan
) {

    const container =
        document.getElementById(
            "insights"
        );


    const topCareer =
        careers[0];


    const score = Math.round(

        readiness?.readiness_score ??
        readiness?.career_readiness ??
        readiness?.score ??
        readiness?.overall_score ??
        0

    );


    const skills =
        profile?.skills
            ?.split(",")
            .map(x => x.trim())
            .filter(Boolean)
            || [];


    const insights = [];


    if (topCareer) {

        insights.push({

            icon: "🎯",

            title: "Strongest Career Fit",

            text:
                `${topCareer.name} currently has the highest compatibility with your profile at ${topCareer.percentage}%.`

        });

    }


    if (skills.length) {

        insights.push({

            icon: "💡",

            title: "Skill Foundation",

            text:
                `You currently have ${skills.length} listed skill${skills.length === 1 ? "" : "s"}. Strengthening these with projects can improve your career profile.`

        });

    }


    insights.push({

        icon: "🚀",

        title: "Next Step",

        text:
            score >= 70
                ? "Focus on practical projects, interview preparation and industry-level skills."
                : "Prioritize the identified skill gaps and complete projects related to your target career."

    });


    container.innerHTML =
        insights.map(item => `

            <div class="insight-card">

                <span>
                    ${item.icon}
                </span>

                <div>

                    <h3>
                        ${item.title}
                    </h3>

                    <p>
                        ${item.text}
                    </p>

                </div>

            </div>

        `).join("");

}


// ==========================================
// LOADING
// ==========================================

function showLoading() {

    document.getElementById("topCareer")
        .textContent = "Analyzing your profile...";

    document.getElementById("topMatch")
        .textContent = "--";

}


// ==========================================
// ERROR
// ==========================================

function showError(message) {

    document.getElementById("topCareer")
        .textContent = "Analysis unavailable";

    document.getElementById("careerDescription")
        .textContent = message;

}


// ==========================================
// SECURITY
// ==========================================

function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}