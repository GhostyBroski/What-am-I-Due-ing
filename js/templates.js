let globalTasks = [];
let selectedCourseCode = null;

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
        renderUI();
    });
}

function formatCourseDisplay(courseString) {
    if (!courseString) return "Unknown";
    const clean = courseString.replace(/\s+/g, ' ').trim();
    if (clean.toLowerCase() === "unknown course" || clean === "") return "Unknown";
    return clean;
}

function getCourseCode(courseString) {
    const cleanName = formatCourseDisplay(courseString);
    if (cleanName === "Unknown") return "??";
    if (cleanName.toLowerCase().includes("rixstix")) return "DRUM";

    const match = cleanName.match(/([A-Z]{2,4})\s*(\d{3,4})/i);
    if (match) return `${match[1].toUpperCase()} ${match[2]}`;

    return cleanName.split(' ')[0].toUpperCase();
}

function parseDate(dateStr) {
    if (!dateStr) return new Date(8640000000000000); 
    let cleaned = dateStr.replace(/Due:/i, "").replace(/at/i, "").trim();
    // Simple check to add year if missing
    if (!cleaned.includes("202")) cleaned += ` ${new Date().getFullYear()}`;
    const d = new Date(cleaned);
    return isNaN(d) ? new Date(8640000000000000) : d;
}

function renderUI() {
    // UPDATED: Match the <div> after #assignments-heading in your index.html
    const todoContainer = document.querySelector("#assignments-heading + div");
    const classContainer = document.querySelector(".class-list");
    
    if (!todoContainer || !classContainer) return;

    todoContainer.innerHTML = "";
    classContainer.innerHTML = "";

    // Generate Course Filter Tags
    const allCourses = [...new Set(globalTasks.map(t => formatCourseDisplay(t.course)))];
    
    allCourses.forEach(courseName => {
        if (courseName === "Unknown") return;
        
        const btn = document.createElement("section");
        btn.className = `class-tag ${selectedCourseCode === courseName ? "active-tag" : ""}`;
        btn.innerHTML = `<h1>${getCourseCode(courseName)}</h1>`;
        btn.title = courseName;
        btn.onclick = () => {
            selectedCourseCode = (selectedCourseCode === courseName) ? null : courseName;
            renderUI();
        };
        classContainer.appendChild(btn);
    });

    // Filtering and Sorting
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

    // Sort by date
    const sortByDate = (a, b) => parseDate(a.dueDate) - parseDate(b.dueDate);
    overdue.sort(sortByDate);
    upcoming.sort(sortByDate);

    renderSection(todoContainer, "Overdue", overdue, true);
    renderSection(todoContainer, "Upcoming", upcoming, false);
}

function renderSection(container, title, tasks, isOverdue) {
    if (tasks.length === 0) return;
    
    const header = document.createElement("h3");
    header.className = "section-title";
    header.style.margin = "10px 0"; // Basic styling for visibility
    header.innerText = title;
    container.appendChild(header);

    tasks.forEach(task => {
        const item = document.createElement("section");
        item.className = `todo-item ${isOverdue ? 'late' : ''}`;
        
        const cleanCourse = formatCourseDisplay(task.course);
        const code = getCourseCode(cleanCourse);

        item.innerHTML = `
            <button class="myButton"></button>
            <div class="task-content" style="cursor: pointer; flex-grow: 1;">
                <h1>${code}</h1>
                <h2>${task.title}</h2>
                <p>${task.dueDate || "No Due Date"}</p>
            </div>
        `;

        // Handle Mark as Complete
        const btn = item.querySelector(".myButton");
        btn.onclick = (e) => {
            e.stopPropagation();
            item.classList.toggle("completed");
            btn.classList.toggle("active");
        };

        // Handle Link Opening
        item.querySelector(".task-content").onclick = () => window.open(task.url, '_blank');

        container.appendChild(item);
    });
}

document.addEventListener('DOMContentLoaded', initPopup);