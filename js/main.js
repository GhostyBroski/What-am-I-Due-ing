document.addEventListener("DOMContentLoaded", () => {
    initDashboard();
    setupAssignmentSlider();  // ← call it here, after DOM is ready
    fullNamehover();

    chrome.storage.sync.get(["courseTasks"], (data) => {
        const tasks = data.courseTasks || [];
    
        tasks.forEach(task => {
            console.log("URL from content.js:", task.url);
        });
    })});
    
    const classTags = document.querySelectorAll(".class-tag");

    classTags.forEach((tag, index) => {
        tag.addEventListener("click", () => {
        const url = classLinks[index] || "https://byui.instructure.com/";
        window.open(url, "_blank");
        });
    });

    // Complete Button Line-through and Check Mark 
    // Shows what is completed and gives user ability to check completed
    document.querySelectorAll(".todo-item").forEach(item => {
        const button = item.querySelector(".myButton");
        if (!button) return;
    
        button.addEventListener("click", (e) => {
            e.stopPropagation();
    
            // toggle completed state
            item.classList.toggle("completed");
            button.classList.toggle("completed");
        });
    });

    // Create tooltips
    fullNamehover();   // ← ADD THIS LINE

    function fullNamehover() {
        // 1. Remove any orphaned tooltips before setting up new ones
        document.querySelectorAll(".course-tooltip").forEach(el => el.remove());

        document.querySelectorAll(".class-tag").forEach(tag => {
            const fullName = tag.dataset.fullName;
            if (!fullName) return;

            let tooltip;

            tag.addEventListener("mouseenter", () => {
                tooltip = document.createElement("div");
                tooltip.className = "course-tooltip";
                tooltip.textContent = fullName;
                document.body.appendChild(tooltip);

                const rect = tag.getBoundingClientRect();
                tooltip.style.position = "absolute";
                tooltip.style.top = `${rect.bottom + window.scrollY}px`;
                tooltip.style.left = `${rect.left + window.scrollX}px`;
            });

            tag.addEventListener("mouseleave", () => {
                if (tooltip) tooltip.remove();
            });

            // 2. ADD THIS: If the user clicks the tag to filter, kill the tooltip immediately
            tag.addEventListener("click", () => {
                if (tooltip) tooltip.remove();
            });
        });
    }

const headings = {
    "assignments": {
        "heading": "Assignments",
        "icon": "📝"
    },
    "announcements": {
        "heading": "Announcements",
        "icon": "📢"
    },
    "calendar": {
        "heading": "Calendar",
        "icon": "📅"
    }
}

 // Section for assignment headings and buttons
const titleEl = document.querySelector(".assign-title");
const weekEl = document.querySelector(".assign-week");
const leftBar = document.querySelector(".left-assign");
const rightBar = document.querySelector(".right-assign");
let order = ["assignments", "announcements", "calendar"];
let center = 0;

function render_headings(){
    const centerKey = order[center]
    const rightKey = order[(center + 1) % 3];
    const leftKey = order[(center + 2) % 3];

    const base = headings[centerKey];
    titleEl.textContent = base.heading;
    rightBar.textContent = headings[rightKey].icon;
    leftBar.textContent = headings[leftKey].icon;
}

rightBar.addEventListener("click", () => {
    center = (center + 1) % 3;
    render_headings();
});

leftBar.addEventListener("click", () => {
    center = (center + 2) % 3;
    render_headings();
});

render_headings();


const courseColors = {};

function buildProgressRings(tasks) {
    const title = document.getElementById("ring-title");
    title.textContent = `You have ${tasks.length} tasks`;

    const svg = document.getElementById("progressRings");
    svg.innerHTML = "";

    const grouped = groupByCourse(tasks);
    const courses = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

    const maxRadius = 65;
    const minRadius = 15;
    const availableSpace = maxRadius - minRadius;
    const thickness = (courses.length > 0) ? (availableSpace / courses.length * 0.8) : 8;
    const gap = (courses.length > 0) ? (availableSpace / courses.length * 0.2) : 2;

    let radius = minRadius;

    courses.forEach(([courseId, courseTasks], index) => {
        const total = courseTasks.length;
        const completed = courseTasks.filter(t => t.isFinished).length;
        const percent = total === 0 ? 0 : completed / total;

        const hue = (index * 360) / courses.length;
        const color = `hsl(${hue}, 70%, 50%)`;
        
        courseColors[courseId] = color;

        // Check if we are currently filtering by a specific course
        // window.selectedCourseId comes from templates.js
        const isDimmed = window.selectedCourseId && window.selectedCourseId != courseId;

        const button = document.querySelector(`.class-tag[data-course-id="${courseId}"]`);
        if (button) {
            button.style.setProperty("--course-color", color);
        }

        // Create a group for the ring pair to handle opacity easily
        const ringGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        if (isDimmed) {
            ringGroup.style.opacity = "0.3"; // Greys out/fades the ring
            ringGroup.style.filter = "grayscale(100%)"; // Optional: adds to the "greyed out" look
        }
        ringGroup.style.transition = "opacity 0.3s ease";

        // Background ring
        ringGroup.appendChild(makeCircle({
            r: radius,
            stroke: "#ccc"
        }));

        // Progress ring
        ringGroup.appendChild(makeCircle({
            r: radius,
            stroke: color,
            percent,
            className: "progress-ring"
        }));

        svg.appendChild(ringGroup);
        radius += thickness + gap;
    });
}

function makeCircle({ r, stroke, percent = 1, className }) {
    const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
    );

    circle.setAttribute("cx", 70);
    circle.setAttribute("cy", 70);
    circle.setAttribute("r", r);
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", stroke);
    circle.setAttribute("stroke-width", 8);
    circle.setAttribute("stroke-linecap", "round");
    circle.style.transform = "rotate(-90deg)";
    circle.style.transformOrigin = "50% 50%";

    if (className) {
        circle.setAttribute("class", className);
    }
    if (percent < 1) {
        const circumference = 2 * Math.PI * r;
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset =
            circumference * (1 - percent);
    }

    return circle;
}


function groupByCourse(tasks) {
    return tasks.reduce((acc, task) => {
        acc[task.course_id] ??= [];
        acc[task.course_id].push(task);
        return acc;
    }, {});
}

function setupAssignmentSlider() {

    const sliderTrack = document.getElementById("assignments-shown-slider");
    const sliderThumb = document.getElementById("slider-status");

    if (!sliderTrack || !sliderThumb) return;

    let showAll = true;

    function applyFilter() {

        const lists = [
            document.getElementById("upcoming-list"),
            document.getElementById("overdue-list"),
            document.getElementById("undated-list")
        ];

        lists.forEach(list => {

            if (!list) return;

            const children = Array.from(list.children);

            let currentHeader = null;
            let visibleInGroup = 0;

            children.forEach(el => {

                if (el.classList.contains("date-header")) {

                    if (currentHeader) {
                        currentHeader.style.display =
                            visibleInGroup === 0 ? "none" : "";
                    }

                    currentHeader = el;
                    visibleInGroup = 0;
                }

                else if (el.classList.contains("todo-item")) {

                    const isCompleted = el.classList.contains("completed");
                    const hide = !showAll && isCompleted;

                    el.style.display = hide ? "none" : "";

                    if (!hide) visibleInGroup++;
                }
            });

            if (currentHeader) {
                currentHeader.style.display =
                    visibleInGroup === 0 ? "none" : "";
            }
        });
    }

    /* ===============================
       LOAD SAVED STATE
    =============================== */

    chrome.storage.local.get(["showAllAssignments"], (data) => {

        showAll = data.showAllAssignments ?? true;

        sliderThumb.classList.toggle("active", showAll);

        applyFilter();
    });

    /* ===============================
       CLICK HANDLER
    =============================== */

    sliderTrack.addEventListener("click", () => {

        showAll = !showAll;

        sliderThumb.classList.toggle("active", showAll);

        chrome.storage.local.set({ showAllAssignments: showAll });

        applyFilter();
    });

    /* ===============================
     AUTO-REAPPLY WHEN LIST CHANGES
    =============================== */

    const lists = [
        document.getElementById("upcoming-list"),
        document.getElementById("overdue-list"),
        document.getElementById("undated-list")
    ];

    const observer = new MutationObserver(() => {
        applyFilter();
    });

    lists.forEach(list => {
        if (list) {
            observer.observe(list, { childList: true });
        }
    });
}