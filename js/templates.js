let globalTasks = [];
let selectedCourseCode = null;

function initPopup() {
    chrome.storage.sync.get(["dashboardTasks", "courseTasks"], (data) => {
        console.log("Data received from local storage:", data); // Check your console!

        const dash = data.dashboardTasks || [];
        const course = data.courseTasks || [];
        
        const combined = [...dash, ...course];
        const uniqueMap = new Map();
        
        combined.forEach(item => {
            if (item.url) uniqueMap.set(item.url, item);
        });
        
        // 2. Filter out assignments from the past (Jan 23 issue)
        const now = new Date();
        now.setHours(0, 0, 0, 0); 

        globalTasks = Array.from(uniqueMap.values()).filter(task => {
            const due = new Date(task.dueDate);
            // Keep it if it's due today, in the future, or has no date
            return isNaN(due.getTime()) || due >= now;
        });

        renderUI();
    });
}

/**
 * Requirement 4 & 7: Clean Spacing & Name Formatting
 */
function formatCourseDisplay(courseString) {
    if (!courseString) return "Unknown";
    const clean = courseString.replace(/\s+/g, ' ').trim();
    if (clean.toLowerCase() === "unknown course" || clean === "") return "Unknown";
    return clean;
}

function getCourseCode(courseString) {
    if (!courseString) return "???";
    
    // Pattern: 2-4 letters, optional space, 3 digits (e.g., CSE 231, CS201)
    const match = courseString.match(/[A-Z]{2,4}\s?\d{3,4}/i);
    return match ? match[0].toUpperCase() : courseString.split(' ')[0].substring(0, 7).toUpperCase();
}

/**
 * Requirement 6: Date Logic for Overdue vs Upcoming
 */
function parseDate(dateStr) {
    if (!dateStr) return new Date(8640000000000000); 
    let cleaned = dateStr.replace(/Due:/i, "").replace(/at/i, "").trim();
    if (!cleaned.includes("202")) cleaned += ` ${new Date().getFullYear()}`;
    return new Date(cleaned);
}

function renderUI() {
    // Target the specific containers from your index.html
    const todoContainer = document.querySelector("#assignments-heading + div");
    const classContainer = document.querySelector(".class-list");
    
    if (!todoContainer || !classContainer) return;

    todoContainer.innerHTML = "";
    classContainer.innerHTML = "";

    // 1. Render Course Tags (Filter Buttons)
    const allCourses = [...new Set(globalTasks.map(t => formatCourseDisplay(t.course)))];
    
    allCourses.forEach(courseName => {
        if (courseName === "Unknown") return; 
        
        const section = document.createElement("section");
        section.className = "class-tag";
        if (selectedCourseCode === courseName) section.classList.add("active-tag"); // Optional CSS class

        section.innerHTML = `<h1>${getCourseCode(courseName)}</h1>`;
        
        section.onclick = () => {
            selectedCourseCode = (selectedCourseCode === courseName) ? null : courseName;
            renderUI();
        };
        classContainer.appendChild(section);
    });

    // 2. Filter and Sort Tasks
    let tasksToDisplay = selectedCourseCode 
        ? globalTasks.filter(t => formatCourseDisplay(t.course) === selectedCourseCode)
        : globalTasks;

    const now = new Date();
    const overdue = [];
    const upcoming = [];

    tasksToDisplay.forEach(task => {
        const d = parseDate(task.dueDate);
        if (d < now) overdue.push(task);
        else upcoming.push(task);
    });

    // 3. Render Sections
    renderSection(todoContainer, "Overdue", overdue, true);
    renderSection(todoContainer, "Upcoming", upcoming, false);
}

function renderSection(container, title, tasks, isLate) {
    if (tasks.length === 0) return;
    
    // Add a section title for clarity
    const sectionHeader = document.createElement("h3");
    sectionHeader.className = "section-header"; 
    sectionHeader.innerText = title;
    container.appendChild(sectionHeader);

    tasks.forEach(task => {
        const item = document.createElement("section");
        // Using your exact classes: 'todo-item' and 'late'
        item.className = `todo-item ${isLate ? "late" : ""}`;

        const code = getCourseCode(task.course);

        item.innerHTML = `
            <button class="myButton"></button>
            <h1>${code}</h1>
            <h2>${task.title}</h2>
            <p>${task.dueDate || "No Due Date"}</p>
        `;

        // Logic for the button (Matches your main.js behavior)
        const btn = item.querySelector(".myButton");
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            item.classList.toggle("completed");
            btn.classList.toggle("active");
        });

        // Click anywhere else on the task to open Canvas
        item.addEventListener("click", () => {
            if (task.url) window.open(task.url, "_blank");
        });

        container.appendChild(item);
    });
}

document.addEventListener('DOMContentLoaded', initPopup);