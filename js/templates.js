let globalTasks = [];
let selectedCourseName = null;

/**
 * 1. Initialize and Sync
 * Grabs data using the exact keys from content.js
 */
function initPopup() {
    chrome.storage.sync.get(["dashboardTasks", "courseTasks"], (data) => {
        const dash = data.dashboardTasks || [];
        const course = data.courseTasks || [];
        
        // Merge and de-duplicate by URL
        const combined = [...dash, ...course];
        const uniqueMap = new Map();
        combined.forEach(item => {
            if (item.url) uniqueMap.set(item.url, item);
        });
        
        globalTasks = Array.from(uniqueMap.values());
        console.log("Templates.js: Tasks loaded", globalTasks);
        
        renderUI();
    });
}

/**
 * 2. Course Code Extractor
 * Formats "Programming with Data Structures" -> "PROG" or grabs "CSE 310"
 */
function getCourseCode(courseString) {
    if (!courseString) return "???";
    // Regex to find patterns like CSE 310
    const match = courseString.match(/[A-Z]{2,4}\s?\d{3,4}/i);
    if (match) return match[0].toUpperCase();
    
    // Fallback: take first 7 chars of the first word
    return courseString.split(' ')[0].substring(0, 7).toUpperCase();
}

/**
 * 3. Main Render Function
 */
function renderUI() {
    // Select the Class List div
    const classListContainer = document.querySelector(".class-list");
    
    // Select the Assignment List div (the one without a class/id after #assignments-heading)
    const assignmentListContainer = document.querySelector("#assignments-heading + div");

    if (!classListContainer || !assignmentListContainer) {
        console.error("Templates.js: Could not find HTML containers.");
        return;
    }

    // Clear the placeholders [Course], [Code], etc.
    classListContainer.innerHTML = "";
    assignmentListContainer.innerHTML = "";

    // --- RENDER CLASS LIST ---
    // Get unique course names exactly as they appear in the data
    const uniqueCourses = [...new Set(globalTasks.map(t => t.course))];

    uniqueCourses.forEach(courseName => {
        if (courseName === "Unknown Course") return;

        const tag = document.createElement("section");
        tag.className = "class-tag";
        tag.setAttribute("data-full-name", courseName); // For main.js tooltips

        tag.innerHTML = `<h1>${getCourseCode(courseName)}</h1>`;

        // Filter logic
        tag.addEventListener("click", () => {
            selectedCourseName = (selectedCourseName === courseName) ? null : courseName;
            renderUI();
        });

        classListContainer.appendChild(tag);
    });

    // --- RENDER ASSIGNMENT LIST ---
    const tasksToDisplay = selectedCourseName 
        ? globalTasks.filter(t => t.course === selectedCourseName)
        : globalTasks;

    tasksToDisplay.forEach(task => {
        const item = document.createElement("section");
        item.className = "todo-item";
        
        // Check for "Late" or "Missed" in the dueDate string from content.js
        if (task.dueDate.toLowerCase().includes("late") || task.dueDate.toLowerCase().includes("missed")) {
            item.classList.add("late");
        }

        // Template matches index.html structure exactly
        item.innerHTML = `
            <button class="myButton"></button>
            <h1>${getCourseCode(task.course)}</h1>
            <h2>${task.title}</h2>
            <p>${task.dueDate || "No Due Date"}</p>
        `;

        // Completion Toggle logic
        const btn = item.querySelector(".myButton");
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            item.classList.toggle("completed");
        });

        // Open assignment link
        item.addEventListener("click", () => {
            if (task.url) window.open(task.url, "_blank");
        });

        assignmentListContainer.appendChild(item);
    });

    // Re-run the tooltip initialization from main.js
    if (typeof fullNamehover === "function") {
        fullNamehover();
    }
}

document.addEventListener('DOMContentLoaded', initPopup);