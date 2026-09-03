/* =========================================================
   AI CAREER INTELLIGENCE — PREMIUM DASHBOARD
   dashboard.js
   ========================================================= */

const API_BASE = "http://127.0.0.1:8000";

/* =========================================================
   USER ID
   Priority:
   1. URL ?user_id=1
   2. localStorage
   3. Default = 1
   ========================================================= */

const params = new URLSearchParams(window.location.search);

let userId =
    params.get("user_id") ||
    localStorage.getItem("user_id") ||
    "1";

localStorage.setItem("user_id", userId);


/* =========================================================
   GLOBAL CHART VARIABLES
   ========================================================= */

let readinessChart = null;
let performanceChart = null;


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function go(page) {
    window.location.href = `${page}?user_id=${encodeURIComponent(userId)}`;
}


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setupNavigation();
    loadDashboard();

    const refreshBtn = document.getElementById("refreshBtn");

    if (refreshBtn) {
        refreshBtn.addEventListener("click", async () => {

            refreshBtn.style.transform = "rotate(360deg)";

            await loadDashboard();

            setTimeout(() => {
                refreshBtn.style.transform = "";
            }, 500);
        });
    }

    const mobileMenu = document.getElementById("mobileMenu");

    if (mobileMenu) {
        mobileMenu.addEventListener("click", () => {
            document.getElementById("sidebar")
                ?.classList.toggle("open");
        });
    }

    const collapseBtn = document.getElementById("collapseBtn");

    if (collapseBtn) {
        collapseBtn.addEventListener("click", () => {

            const sidebar =
                document.getElementById("sidebar");

            const main =
                document.querySelector(".main");

            sidebar?.classList.toggle("collapsed");
            main?.classList.toggle("sidebar-collapsed");

            collapseBtn.textContent =
                sidebar?.classList.contains("collapsed")
                    ? "›"
                    : "‹";
        });
    }
});


/* =========================================================
   NAVIGATION ACTIVE STATE
   ========================================================= */

function setupNavigation() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .replace(".html", "")
            .toLowerCase();

    document.querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.remove("active");

            const page =
                item.dataset.page?.toLowerCase();

            if (
                (currentPage === "dashboard" && page === "dashboard") ||
                (currentPage === "career_analysis" && page === "career-analysis") ||
                (currentPage === "learning-roadmap" && page === "learning-roadmap") ||
                (currentPage === "interview" && page === "interview") ||
                (currentPage === "interview-history" && page === "history") ||
                (currentPage === "profile" && page === "profile")
            ) {
                item.classList.add("active");
            }
        });
}


/* =========================================================
   MAIN DASHBOARD LOADER
   ========================================================= */

async function loadDashboard() {

    try {

        showLoadingState();

        const [
            user,
            profile,
            recommendations,
            readiness,
            actionPlan,
            roadmap,
            history
        ] = await Promise.all([

            fetchJSON(`/users/${userId}`),

            fetchJSON(`/career-profile/${userId}`),

            fetchJSON(`/career-recommendations/${userId}`),

            fetchJSON(`/career-readiness/${userId}`),

            fetchJSON(`/career-gap-action-plan/${userId}`),

            fetchJSON(`/learning-roadmap/${userId}`),

            fetchJSON(`/interview-results/${userId}`)
        ]);


        /* -------------------------------------------------
           USER
        ------------------------------------------------- */

        renderUser(user, profile);


        /* -------------------------------------------------
           CAREER
        ------------------------------------------------- */

        renderCareerRecommendations(
            recommendations,
            profile
        );


        /* -------------------------------------------------
           READINESS
        ------------------------------------------------- */

        renderReadiness(readiness);


        /* -------------------------------------------------
           ACTION PLAN / SKILLS
        ------------------------------------------------- */

        renderActionPlan(actionPlan, profile);


        /* -------------------------------------------------
           ROADMAP
        ------------------------------------------------- */

        renderRoadmap(roadmap);


        /* -------------------------------------------------
           INTERVIEW HISTORY
        ------------------------------------------------- */

        renderInterviewHistory(history);


        /* -------------------------------------------------
           PERFORMANCE
        ------------------------------------------------- */

        renderPerformanceChart(history);


        /* -------------------------------------------------
           STATS
        ------------------------------------------------- */

        renderStats(history);


        /* -------------------------------------------------
           AI INSIGHTS
        ------------------------------------------------- */

        renderInsights(
            profile,
            recommendations,
            readiness,
            history,
            actionPlan
        );

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

        showDashboardError(
            "Unable to load dashboard data. Make sure the FastAPI server is running."
        );
    }
}


/* =========================================================
   GENERIC FETCH HELPER
   ========================================================= */

async function fetchJSON(endpoint) {

    const response =
        await fetch(`${API_BASE}${endpoint}`);

    if (!response.ok) {
        throw new Error(
            `${endpoint} returned ${response.status}`
        );
    }

    return await response.json();
}


/* =========================================================
   LOADING STATE
   ========================================================= */

function showLoadingState() {

    const heroCareer =
        document.getElementById("heroCareer");

    const heroText =
        document.getElementById("heroText");

    if (heroCareer) {
        heroCareer.textContent =
            "Analyzing your best career...";
    }

    if (heroText) {
        heroText.textContent =
            "Your skills, interests and profile are being analyzed by the AI career intelligence engine.";
    }

    const match =
        document.getElementById("heroMatch");

    if (match) {
        match.textContent = "--";
    }
}


/* =========================================================
   USER / PROFILE
   ========================================================= */

function renderUser(user, profile) {

    let name = "Career Explorer";

    if (user) {

        if (Array.isArray(user)) {
            const found =
                user.find(
                    item =>
                        String(item.id) === String(userId)
                );

            if (found?.name) {
                name = found.name;
            }
        } else if (user.name) {
            name = user.name;
        }
    }

    if (
        profile &&
        profile.name &&
        name === "Career Explorer"
    ) {
        name = profile.name;
    }


    const firstName =
        name.split(" ")[0] || name;


    const elements = [
        "userName",
        "topName",
        "sideName"
    ];

    elements.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent = name;
        }
    });


    const initials =
        getInitials(name);


    ["topAvatar", "sideAvatar"].forEach(id => {

        const avatar =
            document.getElementById(id);

        if (avatar) {
            avatar.textContent = initials;
        }
    });
}


function getInitials(name) {

    if (!name) return "AI";

    const parts =
        name.trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}


/* =========================================================
   CAREER RECOMMENDATIONS
   ========================================================= */

function renderCareerRecommendations(
    data,
    profile
) {

    let recommendations = [];

    if (Array.isArray(data)) {
        recommendations = data;
    } else if (
        data &&
        Array.isArray(data.recommendations)
    ) {
        recommendations = data.recommendations;
    }


    recommendations =
        recommendations
            .filter(Boolean)
            .sort(
                (a, b) =>
                    Number(
                        b.match_percentage ?? 0
                    ) -
                    Number(
                        a.match_percentage ?? 0
                    )
            );


    const container =
        document.getElementById("careerMatches");

    if (!container) return;


    if (recommendations.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No career recommendations available yet.
            </div>
        `;

        setHeroCareer(
            profile?.recommended_career ||
            "Software Developer",
            0
        );

        return;
    }


    const topCareer =
        recommendations[0];


    const topName =
        topCareer.career ||
        topCareer.career_name ||
        topCareer.title ||
        "Software Developer";


    const topMatch =
        getMatchPercentage(topCareer);


    setHeroCareer(
        topName,
        topMatch
    );


    container.innerHTML =
        recommendations
            .slice(0, 5)
            .map((career, index) => {

                const name =
                    career.career ||
                    career.career_name ||
                    career.title ||
                    "Career";


                const percentage =
                    getMatchPercentage(career);


                return `
                    <div class="career-match">

                        <div class="career-match-top">

                            <div class="career-name">

                                <span class="career-rank">
                                    ${index + 1}
                                </span>

                                ${escapeHTML(name)}

                            </div>

                            <span class="match-percentage">
                                ${percentage}%
                            </span>

                        </div>

                        <div class="match-track">

                            <div
                                class="match-fill"
                                style="width: 0%"
                                data-width="${percentage}%"
                            ></div>

                        </div>

                    </div>
                `;

            })
            .join("");


    animateProgressBars();
}


/* =========================================================
   MATCH PERCENTAGE
   ========================================================= */

function getMatchPercentage(career) {

    const value =
        career?.match_percentage ??
        career?.matchPercentage ??
        career?.percentage ??
        career?.score ??
        0;

    let percentage =
        Number(value);

    if (!Number.isFinite(percentage)) {
        percentage = 0;
    }

    /*
       If backend returns a decimal
       between 0 and 1, convert it.
    */

    if (
        percentage > 0 &&
        percentage <= 1
    ) {
        percentage *= 100;
    }

    return Math.round(
        Math.max(
            0,
            Math.min(100, percentage)
        )
    );
}


/* =========================================================
   HERO CAREER
   ========================================================= */

function setHeroCareer(
    career,
    percentage
) {

    const careerElement =
        document.getElementById("heroCareer");

    const textElement =
        document.getElementById("heroText");

    const matchElement =
        document.getElementById("heroMatch");


    if (careerElement) {
        careerElement.textContent =
            career;
    }


    if (textElement) {

        if (percentage > 0) {

            textElement.textContent =
                `Your profile shows a ${percentage}% AI-calculated fit for this career based on your skills, interests and background.`;

        } else {

            textElement.textContent =
                "Complete your profile and interview sessions to get a more accurate career-fit analysis.";
        }
    }


    if (matchElement) {

        animateNumber(
            matchElement,
            0,
            percentage,
            900,
            value => `${Math.round(value)}%`
        );
    }
}


/* =========================================================
   PROGRESS BAR ANIMATION
   ========================================================= */

function animateProgressBars() {

    setTimeout(() => {

        document
            .querySelectorAll(".match-fill")
            .forEach(bar => {

                const width =
                    bar.dataset.width || "0%";

                bar.style.width = width;
            });

    }, 150);
}


/* =========================================================
   READINESS
   ========================================================= */

function renderReadiness(data) {

    if (!data) return;


    const score =
        Number(
            data.readiness_score ??
            data.career_readiness ??
            data.score ??
            data.overall_score ??
            0
        );


    const safeScore =
        Math.round(
            Math.max(
                0,
                Math.min(100, score)
            )
        );


    const scoreElement =
        document.getElementById("readinessScore");

    if (scoreElement) {

        animateNumber(
            scoreElement,
            0,
            safeScore,
            900,
            value =>
                Math.round(value)
        );
    }


    const levelElement =
        document.getElementById("readinessLevel");

    if (levelElement) {

        levelElement.textContent =
            getReadinessLevel(safeScore);
    }


    renderReadinessBars(data);

    renderReadinessChart(safeScore);
}


/* =========================================================
   READINESS LEVEL
   ========================================================= */

function getReadinessLevel(score) {

    if (score >= 85) return "Excellent";
    if (score >= 70) return "Strong";
    if (score >= 50) return "Developing";
    if (score >= 30) return "Needs Work";

    return "Getting Started";
}


/* =========================================================
   READINESS BREAKDOWN
   ========================================================= */

function renderReadinessBars(data) {

    const container =
        document.getElementById("readinessBars");

    if (!container) return;


    const possibleMetrics = [

        {
            label: "Skills",
            value:
                data.skill_score ??
                data.skills_score ??
                data.skill_readiness
        },

        {
            label: "Experience",
            value:
                data.experience_score ??
                data.experience_readiness
        },

        {
            label: "Profile",
            value:
                data.profile_score ??
                data.profile_completeness
        },

        {
            label: "Interview",
            value:
                data.interview_score ??
                data.interview_readiness
        }

    ];


    const metrics =
        possibleMetrics
            .filter(
                item =>
                    item.value !== undefined &&
                    item.value !== null
            )
            .slice(0, 4);


    if (metrics.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Readiness breakdown will appear here.
            </div>
        `;

        return;
    }


    container.innerHTML =
        metrics.map(item => {

            let value =
                Number(item.value);

            if (
                value > 0 &&
                value <= 1
            ) {
                value *= 100;
            }

            value =
                Math.round(
                    Math.max(
                        0,
                        Math.min(100, value)
                    )
                );


            return `
                <div class="readiness-bar-item">

                    <div class="readiness-bar-top">

                        <span>
                            ${escapeHTML(item.label)}
                        </span>

                        <span>
                            ${value}%
                        </span>

                    </div>

                    <div class="readiness-bar-track">

                        <div
                            class="readiness-bar-fill"
                            style="width: 0%"
                            data-width="${value}%"
                        ></div>

                    </div>

                </div>
            `;

        }).join("");


    setTimeout(() => {

        container
            .querySelectorAll(".readiness-bar-fill")
            .forEach(bar => {

                bar.style.width =
                    bar.dataset.width;

            });

    }, 100);
}


/* =========================================================
   READINESS DONUT CHART
   ========================================================= */

function renderReadinessChart(score) {

    const canvas =
        document.getElementById("readinessChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }


    if (readinessChart) {
        readinessChart.destroy();
    }


    readinessChart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: [
                    "Ready",
                    "Remaining"
                ],

                datasets: [
                    {
                        data: [
                            score,
                            100 - score
                        ],

                        borderWidth: 0,

                        backgroundColor: [
                            "#7c5cff",
                            "rgba(255,255,255,0.06)"
                        ],

                        hoverBackgroundColor: [
                            "#9b82ff",
                            "rgba(255,255,255,0.08)"
                        ]
                    }
                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "78%",

                animation: {
                    animateRotate: true,
                    duration: 1200
                },

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
}


/* =========================================================
   ACTION PLAN / PRIORITY SKILLS
   ========================================================= */

function renderActionPlan(
    data,
    profile
) {

    const skillContainer =
        document.getElementById("prioritySkills");

    const nextAction =
        document.getElementById("nextAction");


    let skills = [];


    if (Array.isArray(data)) {
        skills = data;
    }


    if (
        data &&
        Array.isArray(data.priority_skills)
    ) {
        skills =
            data.priority_skills;
    }


    if (
        data &&
        Array.isArray(data.missing_skills)
    ) {
        skills =
            data.missing_skills;
    }


    if (
        data &&
        Array.isArray(data.skills)
    ) {
        skills =
            data.skills;
    }


    skills =
        skills
            .filter(Boolean)
            .slice(0, 5);


    if (skillContainer) {

        if (skills.length === 0) {

            skillContainer.innerHTML = `
                <div class="empty-state">
                    No major skill gaps detected.
                </div>
            `;

        } else {

            skillContainer.innerHTML =
                skills.map((skill, index) => {

                    let name = skill;

                    if (
                        typeof skill === "object"
                    ) {
                        name =
                            skill.skill ||
                            skill.name ||
                            skill.title ||
                            "Skill";
                    }


                    return `
                        <div class="skill-item">

                            <div class="skill-item-left">

                                <span class="skill-dot"></span>

                                <span>
                                    ${escapeHTML(name)}
                                </span>

                            </div>

                            <span class="skill-priority">
                                ${index < 2
                                    ? "HIGH"
                                    : "PRIORITY"}
                            </span>

                        </div>
                    `;

                }).join("");
        }
    }


    if (nextAction) {

        const action =
            data?.next_action ||
            data?.recommended_action ||
            data?.action ||
            generateNextAction(
                skills,
                profile
            );


        nextAction.textContent =
            action;
    }
}


/* =========================================================
   GENERATE NEXT ACTION
   ========================================================= */

function generateNextAction(
    skills,
    profile
) {

    if (skills.length > 0) {

        let skill = skills[0];

        if (
            typeof skill === "object"
        ) {
            skill =
                skill.skill ||
                skill.name ||
                "your priority skill";
        }

        return `AI recommends focusing next on ${skill}. Add a small practical project to strengthen this skill.`;
    }


    if (profile?.skills) {

        return "Your profile has a solid skill base. Start a mock interview to identify communication and technical gaps.";
    }


    return "Complete your career profile to receive your personalized next action.";
}


/* =========================================================
   LEARNING ROADMAP
   ========================================================= */

function renderRoadmap(data) {

    const container =
        document.getElementById("roadmap");

    if (!container) return;


    let roadmap = [];


    if (Array.isArray(data)) {
        roadmap = data;
    } else if (
        data &&
        Array.isArray(data.roadmap)
    ) {
        roadmap = data.roadmap;
    } else if (
        data &&
        Array.isArray(data.steps)
    ) {
        roadmap = data.steps;
    }


    roadmap =
        roadmap
            .filter(Boolean)
            .slice(0, 6);


    if (roadmap.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Your personalized learning roadmap will appear here.
            </div>
        `;

        return;
    }


    container.innerHTML =
        roadmap.map((step, index) => {

            let title = "";
            let description = "";
            let duration = "";


            if (typeof step === "string") {

                title = step;
                description =
                    "Build practical knowledge through focused learning.";
            }

            else {

                title =
                    step.title ||
                    step.skill ||
                    step.topic ||
                    step.name ||
                    `Learning Step ${index + 1}`;


                description =
                    step.description ||
                    step.details ||
                    step.action ||
                    "Build practical knowledge through focused learning.";


                duration =
                    step.duration ||
                    step.time ||
                    "";
            }


            return `
                <div class="roadmap-step">

                    <div class="roadmap-number">
                        ${index + 1}
                    </div>

                    <h4>
                        ${escapeHTML(title)}
                    </h4>

                    <p>
                        ${escapeHTML(description)}
                    </p>

                    ${
                        duration
                            ? `<small>${escapeHTML(String(duration))}</small>`
                            : ""
                    }

                </div>
            `;

        }).join("");
}


/* =========================================================
   INTERVIEW HISTORY
   ========================================================= */

function renderInterviewHistory(data) {

    const tbody =
        document.getElementById("historyBody");

    if (!tbody) return;


    let history = [];


    if (Array.isArray(data)) {
        history = data;
    } else if (
        data &&
        Array.isArray(data.results)
    ) {
        history = data.results;
    } else if (
        data &&
        Array.isArray(data.interviews)
    ) {
        history = data.interviews;
    }


    if (history.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        No interview sessions yet.
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    history =
        [...history]
            .sort(
                (a, b) =>
                    new Date(
                        b.created_at ||
                        b.date ||
                        0
                    ) -
                    new Date(
                        a.created_at ||
                        a.date ||
                        0
                    )
            )
            .slice(0, 8);


    tbody.innerHTML =
        history.map(result => {

            const career =
                result.career ||
                "Interview";


            const score =
                Number(
                    result.average_score ??
                    result.score ??
                    0
                );


            const questions =
                result.questions_answered ??
                result.questions ??
                0;


            const warnings =
                result.face_warnings ??
                result.faceWarnings ??
                0;


            const performance =
                getPerformanceLabel(score);


            const performanceClass =
                score >= 8
                    ? "performance-positive"
                    : score >= 5
                        ? "performance-average"
                        : "performance-low";


            return `
                <tr>

                    <td>
                        ${escapeHTML(career)}
                    </td>

                    <td>
                        <span class="score-badge">
                            ${score.toFixed(1)}/10
                        </span>
                    </td>

                    <td>
                        ${questions}
                    </td>

                    <td>
                        ${warnings}
                    </td>

                    <td>
                        <span class="${performanceClass}">
                            ${performance}
                        </span>
                    </td>

                </tr>
            `;

        }).join("");
}


/* =========================================================
   PERFORMANCE LABEL
   ========================================================= */

function getPerformanceLabel(score) {

    if (score >= 8.5) return "Excellent";
    if (score >= 7) return "Strong";
    if (score >= 5) return "Developing";

    return "Needs improvement";
}


/* =========================================================
   INTERVIEW STATS
   ========================================================= */

function renderStats(data) {

    let history = [];


    if (Array.isArray(data)) {
        history = data;
    } else if (
        data?.results &&
        Array.isArray(data.results)
    ) {
        history = data.results;
    }


    const total =
        history.length;


    const scores =
        history
            .map(
                item =>
                    Number(
                        item.average_score ??
                        item.score ??
                        0
                    )
            )
            .filter(
                value =>
                    Number.isFinite(value)
            );


    const average =
        scores.length
            ? scores.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) / scores.length
            : 0;


    const best =
        scores.length
            ? Math.max(...scores)
            : 0;


    const warnings =
        history.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.face_warnings ??
                    item.faceWarnings ??
                    0
                ),
            0
        );


    setText(
        "totalInterviews",
        total
    );

    setText(
        "avgScore",
        average.toFixed(1)
    );

    setText(
        "bestScore",
        best.toFixed(1)
    );

    setText(
        "faceWarnings",
        warnings
    );
}


/* =========================================================
   PERFORMANCE CHART
   ========================================================= */

function renderPerformanceChart(data) {

    const canvas =
        document.getElementById(
            "performanceChart"
        );

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    let history = [];


    if (Array.isArray(data)) {
        history = data;
    } else if (
        data?.results &&
        Array.isArray(data.results)
    ) {
        history = data.results;
    }


    history =
        [...history]
            .sort(
                (a, b) =>
                    new Date(
                        a.created_at ||
                        a.date ||
                        0
                    ) -
                    new Date(
                        b.created_at ||
                        b.date ||
                        0
                    )
            );


    const labels =
        history.length
            ? history.map(
                (_, index) =>
                    `Interview ${index + 1}`
            )
            : [
                "Start",
                "Practice",
                "Improve"
            ];


    const scores =
        history.length
            ? history.map(
                item =>
                    Number(
                        item.average_score ??
                        item.score ??
                        0
                    )
            )
            : [0, 0, 0];


    if (performanceChart) {
        performanceChart.destroy();
    }


    performanceChart =
        new Chart(canvas, {

            type: "line",

            data: {

                labels,

                datasets: [

                    {
                        label: "Interview Score",

                        data: scores,

                        borderColor:
                            "#7c5cff",

                        backgroundColor:
                            "rgba(124,92,255,0.12)",

                        borderWidth: 2,

                        fill: true,

                        tension: 0.4,

                        pointRadius: 4,

                        pointHoverRadius: 7,

                        pointBackgroundColor:
                            "#25d9ff",

                        pointBorderColor:
                            "#07111f",

                        pointBorderWidth: 2
                    }

                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                animation: {

                    duration: 1300,

                    easing: "easeOutQuart"
                },

                interaction: {

                    intersect: false,

                    mode: "index"
                },

                scales: {

                    x: {

                        grid: {
                            display: false
                        },

                        ticks: {
                            color: "#71829a",

                            font: {
                                size: 9
                            }
                        }
                    },

                    y: {

                        min: 0,

                        max: 10,

                        grid: {
                            color:
                                "rgba(255,255,255,0.05)"
                        },

                        ticks: {
                            color: "#71829a",

                            font: {
                                size: 9
                            }
                        }
                    }
                },

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        backgroundColor:
                            "rgba(7,17,31,0.95)",

                        borderColor:
                            "rgba(124,92,255,0.25)",

                        borderWidth: 1,

                        titleColor: "#ffffff",

                        bodyColor: "#b7c4d6",

                        padding: 11,

                        displayColors: false,

                        callbacks: {

                            label:
                                context =>
                                    `Score: ${context.parsed.y}/10`
                        }
                    }
                }
            }
        });
}


/* =========================================================
   AI INSIGHTS
   ========================================================= */

function renderInsights(
    profile,
    recommendations,
    readiness,
    history,
    actionPlan
) {

    const container =
        document.getElementById("insights");

    if (!container) return;


    const insights = [];


    /* -----------------------------------------------------
       CAREER MATCH INSIGHT
    ----------------------------------------------------- */

    let careerList = [];

    if (Array.isArray(recommendations)) {
        careerList = recommendations;
    } else if (
        recommendations?.recommendations
    ) {
        careerList =
            recommendations.recommendations;
    }


    if (careerList.length > 0) {

        const top =
            careerList[0];

        const name =
            top.career ||
            top.career_name ||
            top.title ||
            "your top career";


        const match =
            getMatchPercentage(top);


        insights.push({

            icon: "✦",

            title: "Strong Career Fit",

            text:
                `${name} currently has your strongest AI-calculated match at ${match}%.`
        });
    }


    /* -----------------------------------------------------
       READINESS INSIGHT
    ----------------------------------------------------- */

    const readinessScore =
        Number(
            readiness?.readiness_score ??
            readiness?.career_readiness ??
            readiness?.score ??
            readiness?.overall_score ??
            0
        );


    if (readinessScore > 0) {

        insights.push({

            icon: "◈",

            title: "Readiness",

            text:
                `Your current career readiness is ${Math.round(readinessScore)}/100. ${getReadinessAdvice(readinessScore)}`
        });
    }


    /* -----------------------------------------------------
       INTERVIEW INSIGHT
    ----------------------------------------------------- */

    let results = [];

    if (Array.isArray(history)) {
        results = history;
    } else if (history?.results) {
        results = history.results;
    }


    if (results.length > 0) {

        const scores =
            results.map(
                item =>
                    Number(
                        item.average_score ??
                        item.score ??
                        0
                    )
            );


        const average =
            scores.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) / scores.length;


        insights.push({

            icon: "◉",

            title: "Interview Performance",

            text:
                `Your average interview score is ${average.toFixed(1)}/10. Keep practicing to improve consistency.`
        });
    }


    /* -----------------------------------------------------
       SKILL INSIGHT
    ----------------------------------------------------- */

    const skillCount =
        getSkillCount(actionPlan);


    if (skillCount > 0) {

        insights.push({

            icon: "↗",

            title: "Skill Opportunity",

            text:
                `AI identified ${skillCount} priority skill${skillCount === 1 ? "" : "s"} that can improve your career readiness.`
        });
    }


    /* -----------------------------------------------------
       PROFILE INSIGHT
    ----------------------------------------------------- */

    if (
        profile &&
        profile.skills &&
        profile.interests
    ) {

        insights.push({

            icon: "◎",

            title: "Profile Signal",

            text:
                "Your skills and interests are being used to personalize your career recommendations."
        });
    }


    if (insights.length === 0) {

        insights.push({

            icon: "✦",

            title: "AI Career Intelligence",

            text:
                "Complete your profile and mock interview to unlock personalized AI insights."
        });
    }


    container.innerHTML =
        insights
            .slice(0, 5)
            .map(insight => `

                <div class="insight-card">

                    <div class="insight-icon">
                        ${insight.icon}
                    </div>

                    <div>

                        <b>
                            ${escapeHTML(insight.title)}
                        </b>

                        <p>
                            ${escapeHTML(insight.text)}
                        </p>

                    </div>

                </div>

            `)
            .join("");
}


/* =========================================================
   READINESS ADVICE
   ========================================================= */

function getReadinessAdvice(score) {

    if (score >= 85) {
        return "You are showing strong preparation for your target career.";
    }

    if (score >= 70) {
        return "You are on a strong path; focus on practical projects and interview consistency.";
    }

    if (score >= 50) {
        return "Strengthen your priority skills and continue mock interviews.";
    }

    return "Focus first on building core skills and completing your career profile.";
}


/* =========================================================
   SKILL COUNT
   ========================================================= */

function getSkillCount(data) {

    if (!data) return 0;

    if (Array.isArray(data)) {
        return data.length;
    }

    const arrays = [
        data.priority_skills,
        data.missing_skills,
        data.skills
    ];

    for (const array of arrays) {

        if (Array.isArray(array)) {
            return array.length;
        }
    }

    return 0;
}


/* =========================================================
   ANIMATED NUMBER
   ========================================================= */

function animateNumber(
    element,
    start,
    end,
    duration,
    formatter = value => Math.round(value)
) {

    if (!element) return;


    const startTime =
        performance.now();


    function update(currentTime) {

        const elapsed =
            currentTime - startTime;


        const progress =
            Math.min(
                elapsed / duration,
                1
            );


        const eased =
            1 -
            Math.pow(
                1 - progress,
                3
            );


        const value =
            start +
            (end - start) * eased;


        element.textContent =
            formatter(value);


        if (progress < 1) {

            requestAnimationFrame(update);

        }
    }


    requestAnimationFrame(update);
}


/* =========================================================
   SET TEXT HELPER
   ========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


/* =========================================================
   ERROR DISPLAY
   ========================================================= */

function showDashboardError(message) {

    const containers = [

        document.getElementById("careerMatches"),

        document.getElementById("prioritySkills"),

        document.getElementById("roadmap"),

        document.getElementById("insights")
    ];


    containers.forEach(container => {

        if (container) {

            container.innerHTML = `
                <div class="empty-state">
                    ${escapeHTML(message)}
                </div>
            `;
        }
    });


    const heroText =
        document.getElementById("heroText");

    if (heroText) {
        heroText.textContent =
            message;
    }
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}