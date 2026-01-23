function collectDashboardTasks() {
    // Convert a nodeList to an array (...) and map to task objects
    const tasks = [...document.querySelectorAll(".todo-list .todo-item")].map(item => ({
        // For each item, check if exists if not, return empty string. If exists, get innerText and trim spaces
        title: item.querySelector(".title")?.innerText?.trim() || "",
        dueDate: item.querySelector(".due-date")?.innerText?.trim() || "",
        url: item.querySelector("a")?.href || "",
        course: item.querySelector(".context")?.innerText?.trim() || "Unknown Course",
        source: "dashboard"
    }));

    // Store tasks in chrome storage
    chrome.storage.sync.set({ dashboardTasks: tasks });
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
}


// Determine which function to call based on the current URL path
if (location.pathname === "/") {
    collectDashboardTasks();
}

if (location.pathname.includes("/courses/")) {
    collectCourseTasks();
}

// function loadCanvasTasks() {
    // chrome.storage.sync.get(["dashboardTasks", "courseTasks"], data => {
    //     const dashboard = data.dashboardTasks || [];
    //     const courses = data.courseTasks || [];

    //     const allTasks = [...dashboard, ...courses];
