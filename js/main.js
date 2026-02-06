document.addEventListener("DOMContentLoaded", () => {
    setupTodoButtons();
    scheduleMidnightCleanup();
});
function setupTodoButtons() {
    const buttons = document.querySelectorAll(".myButton");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const todoItem = button.closest(".todo-item");

            // Toggle completed state
            todoItem.classList.toggle("completed");
            button.classList.toggle("active");
        });
    });
}
function scheduleMidnightCleanup() {
    const now = new Date();
    const midnight = new Date();

    midnight.setHours(24, 0, 0, 0); // Next midnight

    const timeUntilMidnight = midnight - now;

    setTimeout(() => {
        removeCompletedTodos();
        scheduleMidnightCleanup(); // Run again tomorrow
    }, timeUntilMidnight);
}
function removeCompletedTodos() {
    const completedTodos = document.querySelectorAll(".todo-item.completed");

    completedTodos.forEach(todo => {
        todo.remove();
    });
}




function buildProgressRings(tasks) {
    const title = document.getElementById("title");
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

chrome.storage.sync.get(["dashboardTasks", "courseTasks"], ({dashboardTasks, courseTasks}) => {
    buildProgressRings([...courseTasks]);           
});

function groupByCourse(tasks) {
    return tasks.reduce((acc, task) => {
        acc[task.course] ??=[];
        acc[task.course].push(task);
        return acc;
    }, {});
}
