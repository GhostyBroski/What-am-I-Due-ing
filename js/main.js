document.addEventListener("DOMContentLoaded", () => {
    initDashboard();
    setupAssignmentSlider();  // ← call it here, after DOM is ready
    fullNamehover();

    // Class Tag Redirects

    // const classLinks = [
    //   "https://byui.instructure.com/courses/310",
    //   "https://byui.instructure.com/courses/212",
    //   "https://byui.instructure.com/courses/999"
    // ];
    chrome.storage.sync.get(["courseTasks"], (data) => {
        const tasks = data.courseTasks || [];
    
        tasks.forEach(task => {
            console.log("URL from content.js:", task.url);
        });
    })});
    

    classTags.forEach((tag, index) => {
        tag.addEventListener("click", () => {
        const url = classLinks[index] || "https://byui.instructure.com/";
        window.open(url, "_blank");
        });
    });
    //Slider buton to show all or only uncompleted assignments
    // function sliderViewAssignments("#slider-status"){
    //     button.addEventListener()
    // }
    // Complete Button
    document.querySelectorAll(".todo-item").forEach(item => {
        const button = item.querySelector(".myButton");
        if (!button) return;

        button.addEventListener("click", (e) => {
        e.stopPropagation();
        item.classList.toggle("completed");
        });
    });

    // Create tooltips
    fullNamehover();   // ← ADD THIS LINE

    function fullNamehover() {
    //     document.querySelectorAll(".class-tag").forEach(tag => {
    //         if (tag.querySelector(".course-tooltip")) return;

    //     const fullName = tag.dataset.fullName;
    //     if (!fullName) return;

    //     const tooltip = document.createElement("div");
    //     tooltip.className = "course-tooltip";
    //     tooltip.textContent = fullName;

    //     tag.appendChild(tooltip);
    //     // document.body.appendChild(tooltip);
    // });

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


  // 3. The Midnight Checker (Moved inside so it can access todoItems)
  function checkMidnight() {
    const now = new Date();
    const todoItems = document.querySelectorAll(".todo-item");
    // Check if it's 00:00 (Midnight)
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        console.log("Midnight cleanup triggered...");
        
        todoItems.forEach(item => {
            // Check if the h1 inside this item has the 'completed' class
            const title = item.querySelector("h1");
            if (title && title.classList.contains("completed")) {
                
                // Visual Fade Out
                item.style.transition = "opacity 0.5s ease, transform 0.5s ease";
                item.style.opacity = "0";
                item.style.transform = "translateX(20px)";
                
                setTimeout(() => {
                    item.remove();
                }, 500);
            }
        });
    }
  }

  // Run the check every 60 seconds
  setInterval(checkMidnight, 60000);


function buildProgressRings(tasks) {
    const title = document.getElementById("ring-title");
    title.textContent = `You have ${tasks.length} tasks`;

    const svg = document.getElementById("progressRings");
    svg.innerHTML = "";

    const grouped = groupByCourse(tasks);

    const courses = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length); // Sort by number of tasks

    const maxRadius = 65;
    const minRadius = 15;
    const availableSpace = maxRadius - minRadius;
    const thickness = availableSpace / courses.length * 0.8;
    const gap = availableSpace / courses.length * 0.2;

    let radius = minRadius;

    courses.forEach(([, courseTasks], index) => {

        const total = courseTasks.length;
        const completed = courseTasks.filter(t => t.isFinished).length;
        const percent = total === 0 ? 0 : completed / total;

        const hue = (index *360) / courses.length;
        const color = `hsl(${hue}, 70%, 50%)`;
        // Background ring
        svg.appendChild(makeCircle({
            r: radius,
            stroke: "#eee"
        }));

        // Progress ring
        svg.appendChild(makeCircle({
            r: radius,
            stroke: color,
            percent,
            className: "progress-ring"
        }));

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

    let showAll = false;

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
                    // Before moving to next header, hide previous if no visible items
                    if (currentHeader) {
                        currentHeader.style.display = visibleInGroup === 0 ? "none" : "";
                    }
                    currentHeader = el;
                    visibleInGroup = 0;

                } else if (el.classList.contains("todo-item")) {
                    const isCompleted = el.classList.contains("completed");
                    const hide = !showAll && isCompleted;
                    el.style.display = hide ? "none" : "";
                    if (!hide) visibleInGroup++;
                }
            });

            // Handle the last header group
            if (currentHeader) {
                currentHeader.style.display = visibleInGroup === 0 ? "none" : "";
            }
        });
    }

    sliderTrack.addEventListener("click", () => {
        showAll = !showAll;
        sliderThumb.classList.toggle("active", showAll);
        applyFilter();
    });

    // Re-run filter when week changes so completed items stay hidden on nav
    document.getElementById("prev-week")?.addEventListener("click", () => applyFilter());
    document.getElementById("next-week")?.addEventListener("click", () => applyFilter());

    applyFilter(); 
}


buildProgressRings(); // Initial empty rings
// });
initDashboard();
setupAssignmentSlider();
