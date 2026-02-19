/**
 * templates.js
 * Responsible for rendering API data into the index.html structure.
 */

let state = {
    allCourses: [],
    overdue: [],
    upcoming: [],
    undated: [],
    selectedCourseId: null,
    currentBucket: 'upcoming' // matches the center heading
};

/**
 * 1. UI Helper: Extracts a clean code like "CSE 310" from Canvas course_code
 */
function formatCourseCode(code) {
    if (!code) return "???";
    // Canvas codes are often "CSE310.01.W26". This regex grabs the "CSE 310" part.
    const match = code.match(/[A-Z]{2,6}\s?\d{3}/i);
    return match ? match[0].toUpperCase() : code.substring(0, 10);
}

function renderDashboard(data) {
    // 1. Hide the loading status and placeholders
    const loader = document.getElementById("loading-status");
    if (loader) loader.style.display = "none";

    // 2. Clear current lists
    const containers = {
        overdue: document.getElementById("overdue-list"),
        upcoming: document.getElementById("upcoming-list"),
        undated: document.getElementById("undated-list")
    };

    Object.values(containers).forEach(c => { if(c) c.innerHTML = ""; });

    // 3. Render Course Tags (Top bar)
    renderCourseList(data.courses, data);

    // 4. Render the 3 Assignment Sections
    renderSection(data.overdue, containers.overdue, "late");
    renderSection(data.upcoming, containers.upcoming, "");
    renderSection(data.undated, containers.undated, "optional");

    if (typeof buildProgressRings === "function") {
        // Combine all tasks for the rings
        const allTasks = [...data.overdue, ...data.upcoming, ...data.undated];
        buildProgressRings(allTasks);
    }

    // 2. Re-attach the Hover Tooltips
    if (typeof fullNamehover === "function") {
        fullNamehover();
    }
}

async function renderSection(list, container, extraClass) {
    if (!container) return;

    // Grab the list of completed IDs from storage
    const storage = await chrome.storage.local.get("completedIds");
    const completedIds = storage.completedIds || [];

    const selectedId = window.selectedCourseId;
    const items = selectedId ? list.filter(a => a.course_id === selectedId) : list;

    container.style.display = items.length > 0 ? "block" : "none";

    items.forEach(task => {
        const isDone = completedIds.includes(task.assignment_id);
        const item = document.createElement("section");
        
        // If it was previously crossed out, add the class immediately
        item.className = `todo-item ${extraClass} ${isDone ? 'completed' : ''}`;
        
        const dateText = task.due_display === "No Due Date" 
            ? "No Due Date" 
            : `Due ${task.due_display}`;
        
        item.innerHTML = `
            <button class="myButton"></button>
            <h1>${formatCourseCode(task.course_code)}</h1>
            <h2>${task.name}</h2>
            <p>${dateText} | ${task.points} points</p>
        `;

        const btn = item.querySelector(".myButton");
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const nowCompleted = item.classList.toggle("completed");
            
            // Save or Remove the ID from persistent storage
            await toggleSavedCompletion(task.assignment_id, nowCompleted);
        });

        item.addEventListener("click", () => {
            if (task.link) window.open(task.link, "_blank");
        });

        container.appendChild(item);
    });
}

// Helper to save to Chrome Storage
async function toggleSavedCompletion(id, isAdding) {
    const data = await chrome.storage.local.get("completedIds");
    let ids = data.completedIds || [];

    if (isAdding) {
        if (!ids.includes(id)) ids.push(id);
    } else {
        ids = ids.filter(existingId => existingId !== id);
    }

    await chrome.storage.local.set({ "completedIds": ids });
}

function renderCourseList(courses, fullData) {
    const container = document.querySelector(".class-list");
    if (!container) return;
    container.innerHTML = "";

    courses.forEach(course => {
        const tag = document.createElement("section");
        tag.className = "class-tag";
        if (window.selectedCourseId === course.id) tag.classList.add("active");
        
        tag.dataset.fullName = course.name;
        tag.innerHTML = `<h1>${formatCourseCode(course.course_code || course.name)}</h1>`;

        tag.addEventListener("click", () => {
            window.selectedCourseId = (window.selectedCourseId === course.id) ? null : course.id;
            renderDashboard(fullData); // Re-render with filter
        });

        container.appendChild(tag);
    });

    if (typeof fullNamehover === "function") fullNamehover();
}

// Export functions for use in main.js
window.renderDashboard = renderDashboard;
window.formatCourseCode = formatCourseCode;