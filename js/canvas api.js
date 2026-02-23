const config = {
    domain: 'byui.instructure.com',
    token: '', 
// ← REPLACE THIS WITH YOUR TOKEN

    // SETTINGS: Change these to filter your results
    settings: {
        daysOut: 999,          // Use 0 for today, 3, 7, or 999 for everything
        specificCourseId: null // Put a Course ID here to filter just one course
    }
};

async function fetchCanvasDashboard() {
    const { domain, token, settings } = config;

    try {
        console.log("🚀 Starting Data-Rich Dashboard...");
        
        // 1. FETCH & LOG COURSES
        const courseUrl = `https://${domain}/api/v1/users/self/courses?access_token=${token}&per_page=100&enrollment_state[]=active&include[]=term`;
        const cResponse = await fetch(courseUrl);
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
                fetch(`https://${domain}/api/v1/courses/${course.id}/assignments?access_token=${token}&per_page=100&include[]=submission&include[]=planner_overrides&order_by=due_at`),
                fetch(`https://${domain}/api/v1/courses/${course.id}/assignments?access_token=${token}&bucket=undated&include[]=submission&include[]=planner_overrides`)
            ]);

            const courseAssignments = await allRes.json();
            const undatedAsns = await uRes.json();

            const processItem = (asm) => {
                const isMarkedDone = asm.planner_overrides?.some(o => o.dismissed || o.marked_complete);
                const status = asm.submission ? asm.submission.workflow_state : 'unsubmitted';
                
                const isFinished = isMarkedDone || status === 'submitted' || status === 'graded';
                // if (isFinished || status === 'graded' || status === 'submitted') return null; // Skip if Canvas considers it done

                return {
                    course_id: asm.course_id, // Captured for rendering logic
                    course_name: course.name,
                    course_code: course.course_code,
                    name: asm.name,
                    points: asm.points_possible !== null ? asm.points_possible : 0,
                    due_display: asm.due_at ? new Date(asm.due_at).toLocaleString() : "No Due Date",
                    rawDate: asm.due_at ? new Date(asm.due_at) : null,
                    link: asm.html_url,
                    assignment_id: asm.id, // Useful for unique keys in React/Vue
                    isFinished: isFinished
                };
            };

            if (Array.isArray(courseAssignments)) {
                courseAssignments.forEach(asm => {
                    const item = processItem(asm);
                    if (!item) return;

                    // If it has a date, it goes into the main list
                    if (item.rawDate) {
                        // Check if it's overdue (past now AND unsubmitted)
                        const isOverdue = item.rawDate < now;
                        if (isOverdue) {
                            overdueList.push(item);
                        } else {
                            upcomingList.push(item);
                        }
                    } else if (item.points > 0) {
                        // Point-bearing undated items go to upcoming
                        upcomingList.push(item);
                    }
                });
            }

            // Process Undated
            if (Array.isArray(undatedAsns)) {
                undatedAsns.forEach(asm => {
                    const item = processItem(asm);
                    if (item) undatedList.push(item);
                });
            }
        }

        // Deduplicate
        const uniqueUndated = Array.from(new Set(undatedList.map(a => a.link)))
            .map(link => undatedList.find(a => a.link === link));

        // Sorts
        overdueList.sort((a, b) => a.rawDate - b.rawDate);
        upcomingList.sort((a, b) => a.rawDate - b.rawDate);

        // 3. FINAL OUTPUT
        console.log("✅ Update Complete");
        
        // Define visible columns for console.table
        const columns = ["course_id", "course_name", "name", "due_display", "points"];

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
            undated: uniqueUndated
        };

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

fetchCanvasDashboard();