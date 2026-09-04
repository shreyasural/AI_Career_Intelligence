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
// INITIAL LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    setText("sidebarUser", userId);

    loadLearningRoadmap();

});


// ==========================================
// LOAD ROADMAP
// ==========================================

async function loadLearningRoadmap() {

    try {

        const response = await fetch(
            `${API_BASE}/learning-roadmap/${userId}`
        );


        if (!response.ok) {

            throw new Error(
                `API Error ${response.status}`
            );

        }


        const data = await response.json();

        console.log("Learning Roadmap:", data);


        renderRoadmap(data);


    } catch (error) {

        console.error(
            "Learning Roadmap Error:",
            error
        );


        showError(
            "Unable to load your learning roadmap. Make sure FastAPI is running."
        );

    }

}


// ==========================================
// MAIN RENDER
// ==========================================

function renderRoadmap(data) {

    if (!data) {

        showError(
            "No learning roadmap was returned by the server."
        );

        return;

    }


    // --------------------------------------
    // TARGET CAREER
    // --------------------------------------

    const career =
        data.career ||
        data.target_career ||
        data.recommended_career ||
        data.career_name ||
        data.role ||
        "Your Target Career";


    setText(
        "targetCareer",
        career
    );


    setText(
        "roadmapTitle",
        `Your Path to ${career}`
    );


    // --------------------------------------
    // DESCRIPTION
    // --------------------------------------

    const description =
        data.description ||
        data.summary ||
        data.overview ||
        data.message ||
        `This roadmap is designed to help you prepare for a career as a ${career} by focusing on the most important skills, projects and technologies.`;


    setText(
        "roadmapDescription",
        description
    );


    // --------------------------------------
    // STAGES
    // --------------------------------------

    const stages =
        extractList(
            data,
            [
                "roadmap",
                "stages",
                "steps",
                "learning_path",
                "learning_roadmap",
                "phases"
            ]
        );


    renderStages(stages);


    // --------------------------------------
    // SKILLS
    // --------------------------------------

    const skills =
        extractList(
            data,
            [
                "skills",
                "skills_to_learn",
                "recommended_skills",
                "learning_skills",
                "technologies_to_learn"
            ]
        );


    renderSkills(skills);


    // --------------------------------------
    // PRIORITY SKILLS
    // --------------------------------------

    const priorities =
        extractList(
            data,
            [
                "priority_skills",
                "high_priority_skills",
                "important_skills",
                "skill_gaps"
            ]
        );


    renderPrioritySkills(
        priorities.length
            ? priorities
            : skills
    );


    // --------------------------------------
    // PROJECTS
    // --------------------------------------

    const projects =
        extractList(
            data,
            [
                "projects",
                "recommended_projects",
                "project_ideas",
                "practical_projects"
            ]
        );


    renderProjects(projects);


    // --------------------------------------
    // GOALS
    // --------------------------------------

    const goals =
        extractList(
            data,
            [
                "goals",
                "career_goals",
                "milestones",
                "objectives"
            ]
        );


    renderGoals(goals);


    // --------------------------------------
    // TECHNOLOGIES
    // --------------------------------------

    const technologies =
        extractList(
            data,
            [
                "technologies",
                "technology_stack",
                "tech_stack",
                "tools",
                "frameworks"
            ]
        );


    renderTechnologies(technologies);

}


// ==========================================
// RENDER STAGES
// ==========================================

function renderStages(stages) {

    const container =
        document.getElementById(
            "roadmapStages"
        );


    if (!container) return;


    if (!stages.length) {

        container.innerHTML = `

            ${createDefaultStages()}

        `;

        return;

    }


    container.innerHTML =
        stages
            .slice(0, 8)
            .map((stage, index) => {

                const title =
                    getItemTitle(
                        stage,
                        `Stage ${index + 1}`
                    );


                const description =
                    getItemDescription(
                        stage,
                        "Build the required knowledge and practical skills for this stage."
                    );


                const status =
                    getItemStatus(
                        stage,
                        index
                    );


                return `

                    <div class="stage">

                        <div class="stage-number">
                            ${index + 1}
                        </div>

                        <h3>
                            ${escapeHTML(title)}
                        </h3>

                        <p>
                            ${escapeHTML(description)}
                        </p>

                        <div class="stage-status">
                            ${escapeHTML(status)}
                        </div>

                    </div>

                `;

            })
            .join("");

}


// ==========================================
// DEFAULT ROADMAP
// ==========================================

function createDefaultStages() {

    const stages = [

        {
            title: "Foundation",
            description:
                "Strengthen programming fundamentals and core computer science concepts.",
            status: "START HERE"
        },

        {
            title: "Core Skills",
            description:
                "Learn the technologies and technical skills required for your target career.",
            status: "BUILD SKILLS"
        },

        {
            title: "Projects",
            description:
                "Apply your knowledge by building practical, portfolio-ready projects.",
            status: "PRACTICE"
        },

        {
            title: "Career Preparation",
            description:
                "Prepare your resume, interviews and real-world problem-solving abilities.",
            status: "GET JOB READY"
        }

    ];


    return stages
        .map((stage, index) => `

            <div class="stage">

                <div class="stage-number">
                    ${index + 1}
                </div>

                <h3>
                    ${stage.title}
                </h3>

                <p>
                    ${stage.description}
                </p>

                <div class="stage-status">
                    ${stage.status}
                </div>

            </div>

        `)
        .join("");

}


// ==========================================
// RENDER SKILLS
// ==========================================

function renderSkills(skills) {

    const container =
        document.getElementById(
            "skillsToLearn"
        );


    if (!container) return;


    if (!skills.length) {

        container.innerHTML = `

            <div class="loading">
                No specific learning skills returned yet.
            </div>

        `;

        return;

    }


    container.innerHTML =
        skills
            .slice(0, 8)
            .map((skill, index) => {

                const name =
                    getItemTitle(
                        skill,
                        "Skill"
                    );


                let progress =
                    20 + index * 8;


                if (
                    typeof skill === "object"
                ) {

                    progress =
                        skill.progress ??
                        skill.completion ??
                        skill.level ??
                        progress;

                }


                progress =
                    normalizePercentage(
                        progress
                    );


                return `

                    <div class="skill-row">

                        <div class="skill-top">

                            <strong>
                                ${escapeHTML(name)}
                            </strong>

                            <span>
                                ${progress}%
                            </span>

                        </div>

                        <div class="progress">

                            <div
                                class="progress-fill"
                                style="width:${progress}%"
                            ></div>

                        </div>

                    </div>

                `;

            })
            .join("");

}


// ==========================================
// PRIORITY SKILLS
// ==========================================

function renderPrioritySkills(
    skills
) {

    const container =
        document.getElementById(
            "prioritySkills"
        );


    if (!container) return;


    if (!skills.length) {

        container.innerHTML = `

            <span class="loading">
                No priority skills identified.
            </span>

        `;

        return;

    }


    container.innerHTML =
        skills
            .slice(0, 10)
            .map(skill => `

                <span class="tag">
                    ${escapeHTML(
                        getItemTitle(
                            skill,
                            "Priority Skill"
                        )
                    )}
                </span>

            `)
            .join("");

}


// ==========================================
// PROJECTS
// ==========================================

function renderProjects(
    projects
) {

    const container =
        document.getElementById(
            "projects"
        );


    if (!container) return;


    if (!projects.length) {

        container.innerHTML = `

            <div class="loading">
                No project recommendations available yet.
            </div>

        `;

        return;

    }


    container.innerHTML =
        projects
            .slice(0, 6)
            .map((project, index) => {

                const title =
                    getItemTitle(
                        project,
                        `Project ${index + 1}`
                    );


                const description =
                    getItemDescription(
                        project,
                        "Build this project to strengthen your practical portfolio."
                    );


                return `

                    <div class="project">

                        <div class="project-icon">
                            ${getProjectIcon(index)}
                        </div>

                        <h3>
                            ${escapeHTML(title)}
                        </h3>

                        <p>
                            ${escapeHTML(description)}
                        </p>

                    </div>

                `;

            })
            .join("");

}


// ==========================================
// GOALS
// ==========================================

function renderGoals(
    goals
) {

    const container =
        document.getElementById(
            "goals"
        );


    if (!container) return;


    if (!goals.length) {

        container.innerHTML = `

            <div class="loading">
                No career goals available yet.
            </div>

        `;

        return;

    }


    container.innerHTML =
        goals
            .slice(0, 7)
            .map((goal, index) => {

                const title =
                    getItemTitle(
                        goal,
                        `Career Goal ${index + 1}`
                    );


                const description =
                    getItemDescription(
                        goal,
                        "Complete this milestone as part of your career preparation."
                    );


                return `

                    <div class="goal">

                        <div class="goal-icon">
                            ${getGoalIcon(index)}
                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(title)}
                            </strong>

                            <span>
                                ${escapeHTML(description)}
                            </span>

                        </div>

                    </div>

                `;

            })
            .join("");

}


// ==========================================
// TECHNOLOGIES
// ==========================================

function renderTechnologies(
    technologies
) {

    const container =
        document.getElementById(
            "technologies"
        );


    if (!container) return;


    if (!technologies.length) {

        container.innerHTML = `

            <span class="loading">
                No technologies returned yet.
            </span>

        `;

        return;

    }


    container.innerHTML =
        technologies
            .slice(0, 15)
            .map(technology => `

                <span class="tag">
                    ${escapeHTML(
                        getItemTitle(
                            technology,
                            "Technology"
                        )
                    )}
                </span>

            `)
            .join("");

}


// ==========================================
// EXTRACT LIST
// ==========================================

function extractList(
    data,
    keys
) {

    if (!data) return [];


    for (const key of keys) {

        const value =
            data[key];


        if (Array.isArray(value)) {

            return value;
        }


        if (
            typeof value === "string" &&
            value.trim()
        ) {

            return value
                .split(/[,;\n]+/)
                .map(x => x.trim())
                .filter(Boolean);

        }

    }


    return [];

}


// ==========================================
// ITEM TITLE
// ==========================================

function getItemTitle(
    item,
    fallback
) {

    if (
        typeof item === "string"
    ) {

        return item;
    }


    if (!item) {

        return fallback;
    }


    return (

        item.title ||

        item.name ||

        item.skill ||

        item.career ||

        item.project ||

        item.goal ||

        item.technology ||

        item.topic ||

        fallback

    );

}


// ==========================================
// ITEM DESCRIPTION
// ==========================================

function getItemDescription(
    item,
    fallback
) {

    if (
        typeof item === "string"
    ) {

        return fallback;
    }


    if (!item) {

        return fallback;
    }


    return (

        item.description ||

        item.details ||

        item.summary ||

        item.explanation ||

        item.action ||

        fallback

    );

}


// ==========================================
// ITEM STATUS
// ==========================================

function getItemStatus(
    item,
    index
) {

    if (
        typeof item === "object" &&
        item?.status
    ) {

        return String(
            item.status
        ).toUpperCase();

    }


    const statuses = [

        "START HERE",

        "BUILD SKILLS",

        "PRACTICE",

        "GET JOB READY",

        "ADVANCED"

    ];


    return (
        statuses[index] ||
        "NEXT STEP"
    );

}


// ==========================================
// PROJECT ICON
// ==========================================

function getProjectIcon(
    index
) {

    const icons = [
        "💻",
        "🤖",
        "📊",
        "🌐",
        "⚙️",
        "🚀"
    ];


    return icons[
        index % icons.length
    ];

}


// ==========================================
// GOAL ICON
// ==========================================

function getGoalIcon(
    index
) {

    const icons = [
        "🎯",
        "📚",
        "💻",
        "🏆",
        "🎤",
        "📄",
        "🚀"
    ];


    return icons[
        index % icons.length
    ];

}


// ==========================================
// NORMALIZE PERCENTAGE
// ==========================================

function normalizePercentage(
    value
) {

    let number =
        Number(value) || 0;


    if (number <= 1) {

        number *= 100;
    }


    return Math.round(
        Math.min(
            100,
            Math.max(
                0,
                number
            )
        )
    );

}


// ==========================================
// SET TEXT
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
// ERROR
// ==========================================

function showError(
    message
) {

    setText(
        "roadmapTitle",
        "Roadmap unavailable"
    );


    setText(
        "roadmapDescription",
        message
    );


    const containers = [

        "roadmapStages",

        "skillsToLearn",

        "prioritySkills",

        "projects",

        "goals",

        "technologies"

    ];


    containers.forEach(id => {

        const element =
            document.getElementById(id);


        if (element) {

            element.innerHTML = `

                <div class="error-box">

                    ${escapeHTML(message)}

                </div>

            `;

        }

    });

}


// ==========================================
// SECURITY
// ==========================================

function escapeHTML(
    value
) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}