
chrome.storage.sync.get(["dashboardTasks", "courseTasks"], ({dashboardTasks = [], courseTasks = []}) => {

    const all = [...dashboardTasks, ...courseTasks];
    const clean = removeDuplicates(all);

    const tasksOnly = clean.filter(task => !task.url.includes("discussion_topics"));

    buildProgressRings(tasksOnly);
});


document.addEventListener("DOMContentLoaded", () => {

  // 1. Class Tag Redirects
  const classTags = document.querySelectorAll(".class-tag");
  const classLinks = [
    "https://byui.instructure.com/courses/310",
    "https://byui.instructure.com/courses/212",
    "https://byui.instructure.com/courses/999" // Fallback link
  ];

  classTags.forEach((tag, index) => {
    tag.addEventListener("click", () => {
      // Use index to pick link, default to Canvas home if out of bounds
      const url = classLinks[index] || "https://byui.instructure.com/";
      window.open(url, "_blank");
    });
  });
//   Complete Button line-through

  document.querySelectorAll(".todo-item").forEach(item => {
    const button = item.querySelector(".myButton");
    if (!button) return;

    button.addEventListener("click", (e) => {
      e.stopPropagation();

      item.classList.toggle("completed");
      button.classList.toggle("active");
    });
  });
//   Tag full name display
//   allCourses.forEach(courseName => {
//     if (courseName === "Unknown") return;
    
//     const btn = document.createElement("section");
//     btn.className = `class-tag ${selectedCourseCode === courseName ? "active-tag" : ""}`;
//     btn.innerHTML = `<h1>${getCourseCode(courseName)}</h1>`;
//     btn.title = courseName;
//     btn.onclick = () => {
//         selectedCourseCode = (selectedCourseCode === courseName) ? null : courseName;
//         renderUI();
//     };
//     classContainer.appendChild(btn);
// });
  
  // 3. The Midnight Checker (Moved inside so it can access todoItems)
  function checkMidnight() {
    const now = new Date();
    
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
});

function buildProgressRings(tasks) {
    const title = document.getElementById("ring-title");
    title.textContent = `You have ${tasks.length} tasks`;
    const svg = document.getElementById("progressRings");
    svg.innerHTML = "";

    const courses = Object.entries(groupByCourse(tasks));

    const center = 70;
    const thickness = 8;
    const gap = 6;
    let radius = 60;

    courses.forEach(([course, courseTasks]) => {
        if (radius <= 10) return; // avoid overlap

        const total = courseTasks.length;
        const completed = courseTasks.filter(t => t.completed).length;
        const percent = total === 0 ? 0 : completed / total;

        // Background ring
        svg.appendChild(makeCircle({
            r: radius,
            stroke: "#eee"
        }));

        // Progress ring
        svg.appendChild(makeCircle({
            r: radius,
            stroke: colorForCourse(course),
            percent
        }));

        radius -= thickness + gap;
    });
}

function makeCircle({ r, stroke, percent = 1 }) {
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
    circle.style.transform = "rotate(-90deg)";
    circle.style.transformOrigin = "50% 50%";

    if (percent < 1) {
        const circumference = 2 * Math.PI * r;
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset =
            circumference * (1 - percent);
    }

    return circle;
}

function colorForCourse(course) {
    const colors = [
        "#4a90e2",
        "#50e3c2",
        "#f5a623",
        "#bd10e0",
        "#7ed321"
    ];

    let hash = 0;
    for (let char of course) {
        hash = (hash + char.charCodeAt(0)) % colors.length;
    }

    return colors[hash];
}



function groupByCourse(tasks) {
    return tasks.reduce((acc, task) => {
        acc[task.course] ??=[];
        acc[task.course].push(task);
        return acc;
    }, {});
}


// Remove duplicate tasks based on URL
function removeDuplicates(tasks) {
    const seen = new Set();
    return tasks.filter(task => {
        if (!task.url) return false; // Skip tasks without a URL
        if (seen.has(task.url)) return false;
        seen.add(task.url);
        return true;
    });
}

// Section for assigment headings and buttons
// Map the url path and store an icon and heading for each section
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

const titleEl = document.querySelector(".assign-title");
const weekEl = document.querySelector(".assign-week");
const leftBar = document.querySelector(".left-assign");
const rightBar = document.querySelector(".right-assign");

let order = ["assignments", "announcements", "calendar"];
let center = 0; //central heading index

function render_headings(){
    const centerKey = order[center]
    const rightKey = order[(center + 1) % 3];
    const leftKey = order[(center + 2) % 3];

    const base = headings[centerKey];
    titleEl.textContent = `${base.heading}`;

    // Right
    rightBar.textContent = headings[rightKey].icon;

    // Left
    leftBar.textContent = headings[leftKey].icon;
}

// if the right heading is clicked, the center becomes the right and the order shifts to the left with the module 3 operator to wrap around
rightBar.addEventListener("click", () => {
    center = (center + 1) % 3;
    render_headings();
});

// if the left heading is clicked, the center becomes the left and the order shifts to the right with the module 3 operator to wrap around
leftBar.addEventListener("click", () => {
    center = (center + 2) % 3; // equivalente a -1 mod 3
    render_headings();
});

render_headings();


