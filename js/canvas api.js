const config = {
    domain: 'byui.instructure.com',
    token: '', // ← REPLACE THIS WITH YOUR TOKEN

    // SETTINGS: Change these to filter your results
    settings: {
        daysOut: 999,          // Use 0 for today, 3, 7, or 999 for everything
        specificCourseId: null // Put a Course ID here to filter just one course
    }
};

async function initDashboard() {
    // 1. Set the initial week to "Now"
    if (typeof getSemesterWeek === "function") {
        window.currentViewWeek = getSemesterWeek(new Date());
    }

    const storage = await chrome.storage.local.get("cachedDashboard");
    
    if (storage.cachedDashboard) {
        // Use the same hydrate logic we built to turn strings into Dates
        const hydrate = (item) => ({
            ...item,
            rawDate: item.rawDate ? new Date(item.rawDate) : null
        });

        const dashboardData = {
            courses: storage.cachedDashboard.courses,
            overdue: (storage.cachedDashboard.overdue || []).map(hydrate),
            upcoming: (storage.cachedDashboard.upcoming || []).map(hydrate),
            undated: (storage.cachedDashboard.undated || []).map(hydrate),
            announcements: storage.cachedDashboard.announcements || []
        };

        window.lastFetchedData = dashboardData;
        window.renderDashboard(dashboardData); // This will now obey Week 7
    }

    fetchCanvasDashboard();
}

async function fetchCanvasDashboard() {
    const { domain, token, settings } = config;

    // Use headers for the token to bypass CORS and follow modern API standards
    const requestHeaders = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
    };

    const localData = await chrome.storage.local.get("completedIds");
    const completedIds = localData.completedIds || [];

    try {
        console.log("🚀 Starting Data-Rich Dashboard...");
        
        // 1. FETCH & LOG COURSES
        const courseUrl = `https://${domain}/api/v1/users/self/courses?per_page=100&enrollment_state[]=active&include[]=term`;
        const cResponse = await fetch(courseUrl, { headers: requestHeaders });
        const allCourses = await cResponse.json();

        const now = new Date();
        const floorDate = new Date();
        floorDate.setDate(now.getDate() - (14 * 7)); 

        const activeCourses = allCourses.filter(c => {
            if (settings.specificCourseId && c.id !== settings.specificCourseId) return false;
            if (!c.term || c.term.name === "Default Term") return false;
            if (!c.term || c.term.name === "Non-Academic") return false;
            const end = c.term.end_at ? new Date(c.term.end_at) : null;
            return !end || now <= end;
        });

        console.log("📚 --- ACTIVE COURSES BEING SCANNED ---");
        console.table(activeCourses.map(c => ({ 
            id: c.id, 
            name: c.name, 
            code: c.course_code,
            term: c.term ? c.term.name : "N/A" 
        })));

        let upcomingList = [];
        let overdueList = [];
        let undatedList = [];
        const limitDate = new Date();
        limitDate.setDate(now.getDate() + settings.daysOut);

        // 2. FETCH ASSIGNMENTS
        for (const course of activeCourses) {
            console.log(`🔎 Scanning assignments for: ${course.name}`);

            const [allRes, uRes] = await Promise.all([
                fetch(`https://${domain}/api/v1/courses/${course.id}/assignments?per_page=100&include[]=submission&include[]=planner_overrides&order_by=due_at`, { headers: requestHeaders }),
                fetch(`https://${domain}/api/v1/courses/${course.id}/assignments?bucket=undated&include[]=submission&include[]=planner_overrides`, { headers: requestHeaders })
            ]);

            const courseAssignments = await allRes.json();
            const undatedAsns = await uRes.json();

            const processItem = (asm) => {
                const isMarkedDone = asm.planner_overrides?.some(o => o.dismissed || o.marked_complete);
                const isManuallyDone = completedIds.includes(asm.id);
                const status = asm.submission ? asm.submission.workflow_state : 'unsubmitted';

                const hasScore = asm.submission && (asm.submission.grade !== null || asm.submission.excused);
                
                const isFinished = isMarkedDone || status === 'submitted' || status === 'graded' || hasScore || isManuallyDone;
                
                return {
                    course_id: asm.course_id,
                    course_name: course.name,
                    course_code: course.course_code,
                    name: asm.name,
                    points: asm.points_possible !== null ? asm.points_possible : 0,
                    due_display: asm.due_at ? new Date(asm.due_at).toLocaleString() : "No Due Date",
                    rawDate: asm.due_at ? asm.due_at : null,
                    link: asm.html_url,
                    assignment_id: asm.id,
                    isFinished: isFinished
                };
            };

            if (Array.isArray(courseAssignments)) {
                courseAssignments.forEach(asm => {
                    const item = processItem(asm);
                    if (!item) return;

                    const now = new Date();

                    if (item.rawDate) {
                        const d = new Date(item.rawDate);
                        const isOverdue = d < now;
                        if (isOverdue) {
                            overdueList.push(item);
                        } else {
                            upcomingList.push(item);
                        }
                    } else if (item.points > 0) {
                        upcomingList.push(item);
                    }
                });
            }

            if (Array.isArray(undatedAsns)) {
                undatedAsns.forEach(asm => {
                    const item = processItem(asm);
                    if (item) undatedList.push(item);
                });
            }
        }

        // 3. FETCH ANNOUNCEMENTS (New Addition)
        console.log("📢 Fetching Full Semester Announcements...");
        const contextCodes = activeCourses.map(c => `context_codes[]=course_${c.id}`).join('&');
        
        // Match your SEMESTER_START from templates.js
        const semesterStart = "2026-01-05T00:00:00Z"; 
        // Set end date to far in the future to capture everything
        const semesterEnd = "2026-05-01T23:59:59Z"; 

        const announcementsUrl = `https://${domain}/api/v1/announcements?${contextCodes}&start_date=${semesterStart}&end_date=${semesterEnd}`;
        
        const aResponse = await fetch(announcementsUrl, { headers: requestHeaders });
        const rawAnnouncements = await aResponse.json();

        const announcementsList = Array.isArray(rawAnnouncements) ? rawAnnouncements.map(ann => ({
            id: ann.id,
            course_id: parseInt(ann.context_code.split('_')[1]),
            title: ann.title,
            message: ann.message,
            posted_at: ann.posted_at,
            author: ann.author?.display_name || "Instructor",
            link: ann.html_url,
            read_state: ann.read_state
        })) : [];

        // Log the results with the new "all-time" context
        if (announcementsList.length > 0) {
            const unreadCount = announcementsList.filter(a => a.read_state === 'unread').length;
            console.log(`📢 --- ALL SEMESTER ANNOUNCEMENTS (${announcementsList.length} total, ${unreadCount} unread) ---`);
            const annColumns = ["course_id", "title", "author", "posted_at", "read_state"];
            console.table(announcementsList, annColumns);
        }

        // 4. DEDUPLICATE & SORT
        const uniqueUndated = Array.from(new Set(undatedList.map(a => a.link)))
            .map(link => undatedList.find(a => a.link === link));
        
        overdueList.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
        upcomingList.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

        // 5. FINAL OUTPUT & LOGGING
        console.log("✅ Update Complete");
        const columns = ["course_id", "course_name", "name", "due_display", "points"];
        const annColumns = ["course_id", "title", "author", "posted_at", "read_state"];

        if (overdueList.length > 0) {
            console.log("⚠️ --- OVERDUE ---");
            console.table(overdueList, columns);
        }

        if (upcomingList.length > 0) {
            console.log(`📅 --- UPCOMING (Next ${settings.daysOut} Days) ---`);
            console.table(upcomingList, columns);
        }

        if (uniqueUndated.length > 0) {
            console.log("📝 --- NO DUE DATE / OPTIONAL ---");
            console.table(uniqueUndated, columns);
        }

        const dashboardData = {
            courses: activeCourses,
            overdue: overdueList,
            upcoming: upcomingList,
            undated: uniqueUndated,
            announcements: announcementsList
        };

        console.log("💾 Saving to Storage:", {
            courses: dashboardData.courses.length,
            overdue: dashboardData.overdue.length,
            upcoming: dashboardData.upcoming.length,
            undated: dashboardData.undated.length,
            announcements: dashboardData.announcements.length
        });

        await chrome.storage.local.set({ "cachedDashboard": dashboardData });

        window.lastFetchedData = dashboardData;

        if (typeof window.renderDashboard === "function") {
            window.renderDashboard(dashboardData);
        } else {
            console.error("renderDashboard is not defined. Check if templates.js loaded correctly.");
        }

    } catch (err) {
        console.error("❌ Dashboard error:", err);
    }
}

initDashboard();