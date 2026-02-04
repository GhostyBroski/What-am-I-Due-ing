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

  const todoItems = document.querySelectorAll(".todo-item");

todoItems.forEach(item => {
    const button = item.querySelector(".myButton");
    if (!button) return;

    button.addEventListener("click", (e) => {
        e.stopPropagation(); 

        // 1. Toggle the visual state of the card
        item.classList.toggle("completed");
        
        // 2. Toggle the button's red/active color
        button.classList.toggle("active");
        
        // 3. Optional: Toggle 'done' if you use that for other logic
        item.classList.toggle("done");
    });
});

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

<<<<<<< HEAD
  // Run the check every 60 seconds
  setInterval(checkMidnight, 60000);
});
=======
function buildProgressRings(tasks) {
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

chrome.storage.sync.get(["dashboardTasks", "courseTasks"], ({dashboardTasks, courseTasks}) => {
    buildProgressRings = ([...dashboardTasks, ...courseTasks]);
});

function groupByCourse(tasks) {
    return tasks.reduce((acc, task) => {
        acc[task.course] ??=[];
        acc[task.course].push(task);
        return acc;
    }, {});
}
>>>>>>> 86255b0e2da92cd6f067b6fc09addbaea0c013e1
