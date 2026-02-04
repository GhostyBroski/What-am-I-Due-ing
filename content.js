console.log("CONTENT SCRIPT 2222 RUNNING on", location.href);

function collectDashboardTasks() {
    // Convert a nodeList to an array (...) and map to task objects
    const items = [...document.querySelectorAll("#planner-todosidebar-item-list li")];

    if (items.length == 0){
        console.log("No dashboard tasks found.");
        return;
    }

    const tasks = items.map(item => {
        const title = item.querySelector(".ToDoSidebarItem__Title span")?.innerText?.trim() || "";
        const course = item.querySelector(".css-79wf76-text")?.innerText?.trim() || "Unknown Course";
        const dueDate = item.querySelector("ul li")?.innerText?.trim() || "";
        const url = item.querySelector("a")?.href || "";

        return {
            title,
            course,
            dueDate,
            url,
            source: "dashboard"
        };
    }).filter(task => task.title && task.url); // Filter out tasks without a title

    // Store tasks in chrome storage
    chrome.storage.sync.set({ dashboardTasks: tasks });
    console.log("Dashboard tasks:", tasks);
}

// Observe changes in the right sidebar
const observer = new MutationObserver(() => {
    collectDashboardTasks();
});

// Start observing when on dashboard
if (location.pathname === "/") {
    observer.observe(document.body, { childList: true, subtree: true });
    console.log("Observer started for dashboard");
}



function collectCourseTasks() {
    // As I don't have access to the actual site structure, I'm making assumptions about the selectors
    // Use course name from breadcrumb or header, fallback to "Unknown Course"
    const courseName =
        document.querySelector("#breadcrumbs .ellipsible")?.innerText?.trim() ||
        document.querySelector(".course-title")?.innerText?.trim() ||
        "Unknown Course";

        // Select assignment rows (Canvas uses both)
        const items = [
            ...document.querySelectorAll(".assignment"),
            ...document.querySelectorAll(".ig-row")
        ];

        const tasks = items
            .map(item => {
                const title =
                    item.querySelector(".ig-title, .title")?.innerText?.trim() || "";

                const dueDate =
                    item.querySelector(".due-date, .ig-details")?.innerText?.trim() || "";

                const url = item.querySelector("a")?.href || "";

                return {
                    title,
                    dueDate,
                    url,
                    course: courseName,
                    source: "course"
                };
            })
            .filter(task => task.title && task.url); // limpiar vacíos

        // Append to existing courseTasks
        chrome.storage.sync.get(["courseTasks"], data => {
            const previous = data.courseTasks || [];
            const updated = [...previous, ...tasks];
            chrome.storage.sync.set({ courseTasks: updated });
        });

    console.log("Course tasks:", tasks);
}

// Determine which function to call based on the current URL path
if (location.pathname === "/") {
    collectDashboardTasks();
}

if (location.pathname.includes("/courses/")) {
    collectCourseTasks();
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
