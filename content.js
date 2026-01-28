console.log("CONTENT SCRIPT 322 RUNNING on", location.href);

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

    // Convert nodeList to array and map to task objects
    // Assuming assignments are in elements with class "assignment" or "ig-row"
    const tasks = [...document.querySelectorAll(".assignment, .ig-row")].map(item => ({
        title: item.querySelector(".ig-title, .title")?.innerText?.trim() || "",
        dueDate: item.querySelector(".due-date, .ig-details")?.innerText?.trim() || "",
        url: item.querySelector("a")?.href || "",
        course: courseName,
        source: "course"
    }));

    // Append tasks to existing courseTasks in chrome storage
    chrome.storage.sync.get(["courseTasks"], data => {
        const previous = data.courseTasks || [];

        // Combine previous tasks with new tasks
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

// function loadCanvasTasks() {
//     chrome.storage.sync.get(["dashboardTasks", "courseTasks"], data => {
//         const dashboard = data.dashboardTasks || [];
//         const courses = data.courseTasks || [];
//
//         const allTasks = [...dashboard, ...courses];
//     });
// }


