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

            fetchJSON(`/career-recommendation/${userId}`),

            fetchJSON(`/career-readiness/${userId}`),

            fetchJSON(`/career-gap-action-plan/${userId}`)
        ]);


        profileData = profile;

        careerData = normalizeCareers(careers);

        readinessData = readiness;

        actionPlanData = actionPlan;


        // Render all sections

        renderProfile(profile);

        renderCareers(careerData);

        renderSkillAnalysis(
            profile,
            actionPlan
        );

        renderReadiness(readiness);

        renderFitAnalysis(
            careerData,
            actionPlan
        );

        renderActionPlan(
            actionPlan,
            careerData
        );

        renderInsights(
            profile,
            careerData,
            readiness,
            actionPlan
        );


    } catch (error) {

        console.error("Career Analysis Error:", error);

        showError(
            "Unable to load career analysis. Make sure FastAPI is running."
        );
    }
}


// ==========================================
// FETCH JSON
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


    setText("skillsValue", skills);

    setText("educationValue", education);

    setText("experienceValue", experience);

    setText("interestsValue", interests);
}


// ==========================================
// NORMALIZE CAREERS
// ==========================================

function normalizeCareers(data) {

    let careers = [];


    if (Array.isArray(data)) {

        careers = data;

    } else if (Array.isArray(data?.recommendations)) {

        careers = data.recommendations;

    } else if (Array.isArray(data?.careers)) {

        careers = data.careers;

    } else if (data?.recommended_career) {

        careers = [
            {
                career: data.recommended_career,
                match_percentage:
                    data.match_percentage || 0
            }
        ];
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
            item.match_score ??
            0;


        percentage = Number(percentage) || 0;


        if (percentage <= 1) {

            percentage *= 100;
        }


        return {

            name: name,

            percentage: Math.round(
                Math.min(100, Math.max(0, percentage))
            ),

            raw: item
        };
    });
}


// ==========================================
// CAREER RENDER
// ==========================================

function renderCareers(careers) {

    const list =
        document.getElementById("careerList");


    if (!list) return;


    if (!careers.length) {

        list.innerHTML = `
            <div class="loading">
                No career recommendations found.
            </div>
        `;

        return;
    }


    // Highest match first

    careers.sort(
        (a, b) =>
            b.percentage - a.percentage
    );


    const top =
        careers[0];


    // HERO

    setText(
        "topCareer",
        top.name
    );

    setText(
        "topMatch",
        `${top.percentage}%`
    );


    setText(
        "careerDescription",
        `Your current profile shows a ${top.percentage}% compatibility with ${top.name}. Focus on the recommended skills, practical projects and interview preparation to improve your career readiness.`
    );


    // CAREER LIST

    list.innerHTML = careers
        .slice(0, 6)
        .map((career, index) => `

            <div class="career-item">

                <div class="career-head">

                    <span class="career-name">
                        ${index + 1}.
                        ${escapeHTML(career.name)}
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


    if (!canvas) return;


    if (typeof Chart === "undefined") {

        console.warn(
            "Chart.js is not loaded."
        );

        return;
    }


    if (careerChart) {

        careerChart.destroy();

        careerChart = null;
    }


    careerChart =
        new Chart(canvas, {

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

                            color: "#8d98b5",

                            callback: value =>
                                `${value}%`
                        },

                        grid: {

                            color:
                                "rgba(255,255,255,.06)"
                        }
                    }
                }
            }
        });
}


// ==========================================
// SKILL ANALYSIS
// ==========================================

function renderSkillAnalysis(
    profile,
    actionPlan
) {

    // --------------------------------------
    // CURRENT SKILLS
    // --------------------------------------

    const skillsText =
        profile?.skills || "";


    const skills =
        parseList(skillsText);


    const strengthContainer =
        document.getElementById(
            "strengthSkills"
        );


    if (strengthContainer) {

        if (skills.length) {

            strengthContainer.innerHTML =
                skills
                    .map(skill => `

                        <span class="skill-tag">
                            ${escapeHTML(skill)}
                        </span>

                    `)
                    .join("");

        } else {

            strengthContainer.innerHTML = `
                <span class="loading">
                    No skills added yet.
                </span>
            `;
        }
    }


    // --------------------------------------
    // PRIORITY SKILLS
    // --------------------------------------

    const priorities =
        extractPrioritySkills(actionPlan);


    const container =
        document.getElementById(
            "prioritySkills"
        );


    if (!container) return;


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


                let priority =
                    typeof skill === "object"
                        ? (
                            skill.priority ??
                            skill.importance ??
                            80 - index * 5
                        )
                        : 80 - index * 5;


                priority =
                    normalizePercentage(priority);


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
// CAREER FIT ANALYSIS
// ==========================================

function renderFitAnalysis(
    careers,
    actionPlan
) {

    const container =
        document.getElementById(
            "careerFitAnalysis"
        );


    if (!container) return;


    if (!careers.length) {

        container.innerHTML = `
            <div class="loading">
                Career fit analysis is unavailable.
            </div>
        `;

        return;
    }


    const topCareer =
        careers[0];


    const matchedSkills =
        extractListFromObject(
            actionPlan,
            [
                "matched_skills",
                "matching_skills",
                "current_skills"
            ]
        );


    const missingSkills =
        extractListFromObject(
            actionPlan,
            [
                "missing_skills",
                "skill_gaps",
                "gap_skills",
                "priority_skills"
            ]
        );


    const fitLevel =
        getFitLevel(
            topCareer.percentage
        );


    container.innerHTML = `

        <div class="fit-main-card">

            <div class="fit-header">

                <div>

                    <span class="overline">
                        TARGET CAREER
                    </span>

                    <h3>
                        ${escapeHTML(topCareer.name)}
                    </h3>

                </div>

                <div class="fit-score">
                    ${topCareer.percentage}%
                </div>

            </div>


            <div class="fit-level">
                ${fitLevel}
            </div>


            <div class="fit-grid">

                <div class="fit-box">

                    <span class="fit-icon">
                        ✓
                    </span>

                    <div>

                        <strong>
                            Matched Skills
                        </strong>

                        <p>
                            ${matchedSkills.length}
                            identified
                        </p>

                    </div>

                </div>


                <div class="fit-box">

                    <span class="fit-icon">
                        ⚡
                    </span>

                    <div>

                        <strong>
                            Skill Gaps
                        </strong>

                        <p>
                            ${missingSkills.length}
                            to improve
                        </p>

                    </div>

                </div>


                <div class="fit-box">

                    <span class="fit-icon">
                        🎯
                    </span>

                    <div>

                        <strong>
                            Career Position
                        </strong>

                        <p>
                            #1 recommendation
                        </p>

                    </div>

                </div>

            </div>


            ${
                matchedSkills.length
                    ? `
                        <div class="fit-skills">

                            <strong>
                                Matching Skills
                            </strong>

                            <div class="skill-tags">

                                ${matchedSkills
                                    .slice(0, 10)
                                    .map(skill => `
                                        <span class="skill-tag">
                                            ${escapeHTML(
                                                getSkillName(skill)
                                            )}
                                        </span>
                                    `)
                                    .join("")}

                            </div>

                        </div>
                    `
                    : ""
            }


            ${
                missingSkills.length
                    ? `
                        <div class="fit-skills">

                            <strong>
                                Skills to Develop
                            </strong>

                            <div class="skill-tags">

                                ${missingSkills
                                    .slice(0, 10)
                                    .map(skill => `
                                        <span class="skill-tag">
                                            ${escapeHTML(
                                                getSkillName(skill)
                                            )}
                                        </span>
                                    `)
                                    .join("")}

                            </div>

                        </div>
                    `
                    : ""
            }

        </div>


        <div class="fit-careers">

            ${careers
                .slice(0, 6)
                .map((career, index) => `

                    <div class="fit-career-row">

                        <span>
                            ${index + 1}.
                            ${escapeHTML(career.name)}
                        </span>

                        <div class="fit-mini-bar">

                            <div
                                style="width:${career.percentage}%"
                            ></div>

                        </div>

                        <strong>
                            ${career.percentage}%
                        </strong>

                    </div>

                `)
                .join("")}

        </div>
    `;
}


// ==========================================
// CAREER GAP & ACTION PLAN
// ==========================================

function renderActionPlan(
    actionPlan,
    careers
) {

    const container =
        document.getElementById(
            "actionPlan"
        );


    if (!container) return;


    const topCareer =
        careers?.[0];


    const missingSkills =
        extractListFromObject(
            actionPlan,
            [
                "missing_skills",
                "skill_gaps",
                "gap_skills",
                "priority_skills"
            ]
        );


    const recommendedActions =
        extractListFromObject(
            actionPlan,
            [
                "actions",
                "recommended_actions",
                "action_items",
                "steps"
            ]
        );


    const projects =
        extractListFromObject(
            actionPlan,
            [
                "projects",
                "recommended_projects",
                "project_ideas"
            ]
        );


    const skillsToLearn =
        extractListFromObject(
            actionPlan,
            [
                "skills_to_learn",
                "recommended_skills",
                "learning_skills"
            ]
        );


    const description =
        actionPlan?.description ||
        actionPlan?.summary ||
        actionPlan?.recommendation ||
        "Build practical skills and complete career-focused projects to close your identified gaps.";


    container.innerHTML = `

        <div class="action-intro">

            <span class="ai-badge">
                AI ACTION PLAN
            </span>

            <h3>
                Your next steps
                ${
                    topCareer
                        ? `for ${escapeHTML(topCareer.name)}`
                        : ""
                }
            </h3>

            <p>
                ${escapeHTML(description)}
            </p>

        </div>


        <div class="action-grid">

            ${
                skillsToLearn.length
                    ? `
                        <div class="action-card">

                            <div class="action-icon">
                                📚
                            </div>

                            <h4>
                                Skills to Learn
                            </h4>

                            <ul>

                                ${skillsToLearn
                                    .slice(0, 5)
                                    .map(skill => `
                                        <li>
                                            ${escapeHTML(
                                                getSkillName(skill)
                                            )}
                                        </li>
                                    `)
                                    .join("")}

                            </ul>

                        </div>
                    `
                    : ""
            }


            ${
                missingSkills.length
                    ? `
                        <div class="action-card">

                            <div class="action-icon">
                                🛠️
                            </div>

                            <h4>
                                Close Skill Gaps
                            </h4>

                            <ul>

                                ${missingSkills
                                    .slice(0, 5)
                                    .map(skill => `
                                        <li>
                                            ${escapeHTML(
                                                getSkillName(skill)
                                            )}
                                        </li>
                                    `)
                                    .join("")}

                            </ul>

                        </div>
                    `
                    : ""
            }


            ${
                recommendedActions.length
                    ? `
                        <div class="action-card">

                            <div class="action-icon">
                                🚀
                            </div>

                            <h4>
                                Recommended Actions
                            </h4>

                            <ul>

                                ${recommendedActions
                                    .slice(0, 5)
                                    .map(action => `
                                        <li>
                                            ${escapeHTML(
                                                getSkillName(action)
                                            )}
                                        </li>
                                    `)
                                    .join("")}

                            </ul>

                        </div>
                    `
                    : ""
            }


            ${
                projects.length
                    ? `
                        <div class="action-card">

                            <div class="action-icon">
                                💻
                            </div>

                            <h4>
                                Build Projects
                            </h4>

                            <ul>

                                ${projects
                                    .slice(0, 5)
                                    .map(project => `
                                        <li>
                                            ${escapeHTML(
                                                getSkillName(project)
                                            )}
                                        </li>
                                    `)
                                    .join("")}

                            </ul>

                        </div>
                    `
                    : ""
            }

        </div>
    `;
}


// ==========================================
// READINESS
// ==========================================

function renderReadiness(data) {

    if (!data) return;


    const score = normalizePercentage(

        data.readiness_score ??

        data.career_readiness ??

        data.score ??

        data.overall_score ??

        0
    );


    setText(
        "readinessScore",
        score
    );


    let level =
        "Needs Improvement";


    if (score >= 80) {

        level = "Excellent";

    } else if (score >= 65) {

        level = "Career Ready";

    } else if (score >= 50) {

        level = "Developing";
    }


    setText(
        "readinessLevel",
        level
    );


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


// ==========================================
// READINESS VALUE
// ==========================================

function getReadinessValue(
    data,
    keys
) {

    for (const key of keys) {

        if (
            data[key] !== undefined &&
            data[key] !== null
        ) {

            return normalizePercentage(
                data[key]
            );
        }
    }


    return 0;
}


// ==========================================
// READINESS BAR
// ==========================================

function setReadinessBar(
    labelId,
    progressId,
    value
) {

    const label =
        document.getElementById(labelId);

    const progress =
        document.getElementById(progressId);


    if (label) {

        label.textContent =
            `${value}%`;
    }


    if (progress) {

        setTimeout(() => {

            progress.style.width =
                `${value}%`;

        }, 100);
    }
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


    if (!container) return;


    const topCareer =
        careers[0];


    const score =
        normalizePercentage(

            readiness?.readiness_score ??

            readiness?.career_readiness ??

            readiness?.score ??

            readiness?.overall_score ??

            0
        );


    const skills =
        parseList(
            profile?.skills || ""
        );


    const gaps =
        extractListFromObject(
            actionPlan,
            [
                "missing_skills",
                "skill_gaps",
                "gap_skills",
                "priority_skills"
            ]
        );


    const insights = [];


    // Career fit

    if (topCareer) {

        insights.push({

            icon: "🎯",

            title: "Strongest Career Fit",

            text:
                `${topCareer.name} currently has the highest compatibility with your profile at ${topCareer.percentage}%.`
        });
    }


    // Skills

    if (skills.length) {

        insights.push({

            icon: "💡",

            title: "Skill Foundation",

            text:
                `You currently have ${skills.length} listed skill${skills.length === 1 ? "" : "s"}. Strengthening these through practical projects can improve your career profile.`
        });
    }


    // Skill gaps

    if (gaps.length) {

        insights.push({

            icon: "⚡",

            title: "Priority Gap",

            text:
                `Your analysis identifies ${gaps.length} skill gap${gaps.length === 1 ? "" : "s"}. Focus on these before adding lower-priority technologies.`
        });
    }


    // Readiness

    insights.push({

        icon: "🚀",

        title: "Recommended Next Step",

        text:
            score >= 70
                ? "Focus on practical projects, interview preparation and industry-level skills."
                : "Prioritize the identified skill gaps and complete projects related to your target career."
    });


    container.innerHTML =
        insights
            .slice(0, 4)
            .map(item => `

                <div class="insight-card">

                    <span>
                        ${item.icon}
                    </span>

                    <div>

                        <h3>
                            ${escapeHTML(item.title)}
                        </h3>

                        <p>
                            ${escapeHTML(item.text)}
                        </p>

                    </div>

                </div>

            `)
            .join("");
}


// ==========================================
// EXTRACT PRIORITY SKILLS
// ==========================================

function extractPrioritySkills(
    actionPlan
) {

    return extractListFromObject(
        actionPlan,
        [
            "priority_skills",
            "missing_skills",
            "skill_gaps",
            "gap_skills",
            "skills"
        ]
    );
}


// ==========================================
// GENERIC LIST EXTRACTION
// ==========================================

function extractListFromObject(
    data,
    keys
) {

    if (!data) return [];


    if (Array.isArray(data)) {

        return data;
    }


    for (const key of keys) {

        if (Array.isArray(data[key])) {

            return data[key];
        }


        if (
            typeof data[key] === "string" &&
            data[key].trim()
        ) {

            return parseList(data[key]);
        }
    }


    return [];
}


// ==========================================
// PARSE SKILLS / LISTS
// ==========================================

function parseList(value) {

    if (Array.isArray(value)) {

        return value;
    }


    if (!value) return [];


    return String(value)
        .split(/[,;\n]+/)
        .map(item => item.trim())
        .filter(Boolean);
}


// ==========================================
// GET SKILL NAME
// ==========================================

function getSkillName(value) {

    if (typeof value === "string") {

        return value;
    }


    if (!value) {

        return "Item";
    }


    return (
        value.skill ||
        value.name ||
        value.title ||
        value.action ||
        value.description ||
        "Item"
    );
}


// ==========================================
// FIT LEVEL
// ==========================================

function getFitLevel(score) {

    if (score >= 85) {

        return "Excellent Career Fit";

    } else if (score >= 70) {

        return "Strong Career Fit";

    } else if (score >= 55) {

        return "Promising Career Fit";

    } else if (score >= 40) {

        return "Developing Career Fit";
    }


    return "Career Fit Needs Improvement";
}


// ==========================================
// NORMALIZE PERCENTAGE
// ==========================================

function normalizePercentage(value) {

    let number =
        Number(value) || 0;


    if (number <= 1) {

        number *= 100;
    }


    return Math.round(
        Math.min(
            100,
            Math.max(0, number)
        )
    );
}


// ==========================================
// SAFE TEXT
// ==========================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? "";
    }
}


// ==========================================
// LOADING
// ==========================================

function showLoading() {

    setText(
        "topCareer",
        "Analyzing your profile..."
    );

    setText(
        "topMatch",
        "--"
    );
}


// ==========================================
// ERROR
// ==========================================

function showError(message) {

    setText(
        "topCareer",
        "Analysis unavailable"
    );


    setText(
        "topMatch",
        "--"
    );


    setText(
        "careerDescription",
        message
    );


    const containers = [
        "careerList",
        "careerFitAnalysis",
        "actionPlan",
        "insights"
    ];


    containers.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {

            element.innerHTML = `
                <div class="loading">
                    ${escapeHTML(message)}
                </div>
            `;
        }
    });
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