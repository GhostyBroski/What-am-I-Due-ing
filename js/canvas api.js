const config = {
    domain: 'byui.instructure.com',
    token: 'YOUR_CANVAS_TOKEN_HERE', // ← REPLACE THIS WITH YOUR TOKEN

    // SETTINGS: Change these to filter your results
    settings: {
        daysOut: 7,          // Use 0 for today, 3, 7, or 999 for everything
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

            const [oRes, fRes, uRes] = await Promise.all([
                fetch(`https://${domain}/api/v1/courses/${course.id}/assignments?access_token=${token}&bucket=overdue&include[]=submission&include[]=planner_overrides`),
                fetch(`https://${domain}/api/v1/courses/${course.id}/assignments?access_token=${token}&bucket=future&include[]=submission&include[]=planner_overrides&order_by=due_at`),
                fetch(`https://${domain}/api/v1/courses/${course.id}/assignments?access_token=${token}&bucket=undated&include[]=submission&include[]=planner_overrides`)
            ]);

            const overdueAsns = await oRes.json();
            const futureAsns = await fRes.json();
            const undatedAsns = await uRes.json();

            const processItem = (asm) => {
                const isMarkedDone = asm.planner_overrides?.some(o => o.dismissed || o.marked_complete);
                const status = asm.submission ? asm.submission.workflow_state : 'unsubmitted';
                
                if (isMarkedDone || status === 'graded' || status === 'submitted') return null;

                return {
                    course_id: asm.course_id, // Captured for rendering logic
                    course_name: course.name,
                    course_code: course.course_code,
                    name: asm.name,
                    points: asm.points_possible !== null ? asm.points_possible : 0,
                    due_display: asm.due_at ? new Date(asm.due_at).toLocaleString() : "No Due Date",
                    rawDate: asm.due_at ? new Date(asm.due_at) : null,
                    link: asm.html_url,
                    assignment_id: asm.id // Useful for unique keys in React/Vue
                };
            };

            // Process Overdue
            if (Array.isArray(overdueAsns)) {
                overdueAsns.forEach(asm => {
                    const item = processItem(asm);
                    if (item && item.rawDate && item.rawDate >= floorDate) overdueList.push(item);
                });
            }

            // Process Upcoming
            if (Array.isArray(futureAsns)) {
                futureAsns.forEach(asm => {
                    const item = processItem(asm);
                    if (item) {
                        if (item.rawDate) {
                            if (settings.daysOut >= 999 || item.rawDate <= limitDate) upcomingList.push(item);
                        } else {
                            undatedList.push(item);
                        }
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