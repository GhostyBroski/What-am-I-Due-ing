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

const SEMESTER_START = new Date('2026-01-05T00:00:00');
let currentViewWeek = getSemesterWeek(new Date());

function getSemesterWeek(date) {
    const diffInMs = date - SEMESTER_START;
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    return Math.ceil((diffInDays + 1) / 7);
}

function getRangeForWeek(weekNum) {
    const start = new Date(SEMESTER_START);
    start.setDate(start.getDate() + (weekNum - 1) * 7);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 7); // 7 days later
    
    return { start, end };
}

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
    currentViewWeek = window.currentViewWeek || getSemesterWeek(new Date());

    // 1. Hide the loading status and placeholders
    const loader = document.getElementById("loading-status");
    if (loader) loader.style.display = "none";

    const range = getRangeForWeek(window.currentViewWeek);

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
    
    const allDated = [...data.overdue, ...data.upcoming];
    renderSection(allDated, containers.upcoming, "");
    

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

    // 1. Storage & Filtering
    const storage = await chrome.storage.local.get("completedIds");
    const completedIds = storage.completedIds || [];
    const weekRange = getRangeForWeek(currentViewWeek);

    const cleanList = list.map(item => ({
        ...item,
        rawDate: item.rawDate ? new Date(item.rawDate) : null
    }));

    const items = cleanList.filter(task => {
        const matchesCourse = !window.selectedCourseId || task.course_id === window.selectedCourseId;
        
        if (!task.rawDate && task.points > 0) return true; 

        // Now task.rawDate is a real Date object, so this works!
        const matchesWeek = task.rawDate >= weekRange.start && task.rawDate < weekRange.end;
        return matchesCourse && matchesWeek;
        // return matchesCourse;
    });

    const weekDisplay = document.querySelector(".assign-week");
    if (weekDisplay) weekDisplay.textContent = `Week ${currentViewWeek}`;

    container.style.display = items.length > 0 ? "block" : "none";
    container.innerHTML = "";

    // 2. Sorting by Date (Ensure "No Due Date" is at the bottom)
    items.sort((a, b) => {
        if (!a.rawDate) return 1;
        if (!b.rawDate) return -1;
        return a.rawDate - b.rawDate;
    });

    let lastWeekLabel = "";

    items.forEach(task => {
        const weekNum = getSemesterWeek(task.rawDate);
        const dayName = task.rawDate ? task.rawDate.toLocaleDateString(undefined, { weekday: 'long' }) : "";
        const dateDigit = task.rawDate ? task.rawDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "";
        
        // Header Label: "Week 7 - Thursday, Feb 19"
        let currentHeaderLabel = task.rawDate ? `Week ${weekNum} — ${dayName}, ${dateDigit}` : "No Due Date";

        if (currentHeaderLabel !== lastWeekLabel) {
            const header = document.createElement("div");
            header.className = "date-header";
            header.innerHTML = `<h3>${currentHeaderLabel}</h3>`;
            container.appendChild(header);
            lastWeekLabel = currentHeaderLabel;
        }

        // 4. Create the Assignment Item (Same as your original logic)
        const isManuallyDone = completedIds.includes(task.assignment_id);
        const isCanvasDone = task.isFinished;
        const item = document.createElement("section");
        const completedClass = (isManuallyDone || isCanvasDone) ? 'completed' : '';
        // if (completedClass) return null; // Skip rendering if marked done in Canvas
        item.className = `todo-item ${extraClass} ${completedClass}`;
        
        // Clean up text: only show time/points inside the item since date is in the header
        const timeText = !task.rawDate 
            ? "No Due Date" 
            : task.rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        item.innerHTML = `
            <button class="myButton"></button>
            <h1>${formatCourseCode(task.course_code)}</h1>
            <h2>${task.name}</h2>
            <p>${timeText} | ${task.points} points</p>
        `;

        // Logic for buttons and links
        const btn = item.querySelector(".myButton");
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const nowCompleted = item.classList.toggle("completed");
            btn.classList.toggle("completed", nowCompleted); // ← syncs button state
            await toggleSavedCompletion(task.assignment_id, nowCompleted);
        });

        item.addEventListener("click", () => {
            if (task.link) window.open(task.link, "_blank");
        });

        container.appendChild(item);
    });

    // const weekIndicator = document.querySelector(".assign-week");
    // if (weekIndicator) {
    //     weekIndicator.textContent = `Week ${getSemesterWeek(new Date())}`;
    // }
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

document.getElementById("prev-week").addEventListener("click", () => {
    if (window.currentViewWeek > 1) {
        window.currentViewWeek--; // Update global week
        if (window.lastFetchedData) renderDashboard(window.lastFetchedData);
    }
});

document.getElementById("next-week").addEventListener("click", () => {
    if (window.currentViewWeek < 14) {
        window.currentViewWeek++; // Update global week
        if (window.lastFetchedData) renderDashboard(window.lastFetchedData);
    }
});

// Export functions for use in main.js
window.renderDashboard = renderDashboard;
window.formatCourseCode = formatCourseCode;