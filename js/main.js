document.getElementById('myButton').addEventListener('click', function(){
    alert('Button clicked!');
});
// Get all class tags
const classTags = document.querySelectorAll(".class-tag");

// URLs for each class (same order as in HTML)
const classLinks = [
    // WILL UPDATE THIS TO CONNECT TO INDIVIDUALS CLASSES WHEN WE GET CONNECTED TO CANVAS API!!!!!!!
  "https://byui.instructure.com/courses/310", // CSE 310
  "https://byui.instructure.com/courses/212", // CSE 212
  "https://example.com" // Placeholder class
];
classTags.forEach((tag, index) => {
  tag.style.cursor = "pointer"; // shows it's clickable

  tag.addEventListener("click", () => {
    window.open(classLinks[index], "_blank");
  });
});
// --- PART A: The Click Handler ---
const todoItems = document.querySelectorAll(".todo-item");

todoItems.forEach(item => {
  const button = item.querySelector("button");

  button.addEventListener("click", () => {
    // Toggle the strike-through class on the text elements
    item.querySelectorAll("h1, h2, p").forEach(el => {
      el.classList.toggle("completed");
    });
    
    // Toggle the button's look
    button.classList.toggle("active");
  });
});

// --- PART B: The Midnight Checker ---
function checkMidnight() {
    const now = new Date();
    
    // Check if it's exactly midnight (Hour 0, Minute 0)
    // We check seconds to ensure it triggers right at the start of the minute
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        todoItems.forEach(item => {
            // Check if this item was marked as completed
            const isDone = item.querySelector("h1").classList.contains("completed");
            
            if (isDone) {
                // Fade out and remove
                item.style.transition = "opacity 0.5s ease";
                item.style.opacity = "0";
                
                setTimeout(() => {
                    item.remove();
                    // Because it's a Flex/Grid layout, 
                    // other items will naturally move up!
                }, 500);
            }
        });
    }
}

// Run the check every 60 seconds
setInterval(checkMidnight, 60000);

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
