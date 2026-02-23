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

// async function startOAuth() {
//     const CLIENT_ID = 'YOUR_CANVAS_CLIENT_ID';
//     const REDIRECT_URI = chrome.identity.getRedirectURL(); // Generates the https://<id>.chromiumapp.org/ URL
    
//     const authUrl = `https://byui.instructure.com/login/oauth2/auth?` +
//                     `client_id=${CLIENT_ID}&` +
//                     `response_type=code&` +
//                     `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
//                     `scope=url_scopes_here`;

//     chrome.identity.launchWebAuthFlow({
//         url: authUrl,
//         interactive: true
//     }, async (redirectUrl) => {
//         if (chrome.runtime.lastError || !redirectUrl) {
//             console.error("Auth failed:", chrome.runtime.lastError);
//             return;
//         }

//         // Extract the temporary code from the URL
//         const url = new URL(redirectUrl);
//         const code = url.searchParams.get('code');

//         // Step 3: Send this code to your PROXY, not directly to Canvas
//         const tokenData = await exchangeCodeViaProxy(code);
        
//         // Save the token for future use
//         chrome.storage.local.set({ canvasToken: tokenData.access_token });
//     });
// }

// async function handleLogin() {
//     const CLIENT_ID = "YOUR_CLIENT_ID";
//     // This is a special URL Chrome generates for your specific extension
//     const REDIRECT_URI = chrome.identity.getRedirectURL(); 
    
//     const authUrl = `https://byui.instructure.com/login/oauth2/auth?` +
//         `client_id=${CLIENT_ID}&` +
//         `response_type=code&` +
//         `redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

//     // 1. Open the Canvas Login Window
//     chrome.identity.launchWebAuthFlow({
//         url: authUrl,
//         interactive: true
//     }, async (responseUrl) => {
//         const url = new URL(responseUrl);
//         const code = url.searchParams.get('code');

//         // 2. Send the code to your NEW Vercel proxy
//         const tokenResponse = await fetch('https://vercel.com/ghostybroskis-projects/whatamidueing', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ 
//                 code: code,
//                 redirect_uri: REDIRECT_URI
//             })
//         });

//         const data = await tokenResponse.json();
        
//         // 3. Save the token and refresh the dashboard!
//         if (data.access_token) {
//             await chrome.storage.local.set({ canvasToken: data.access_token });
//             fetchCanvasDashboard(); 
//         }
//     });
// }

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
            undated: (storage.cachedDashboard.undated || []).map(hydrate)
        };

        window.lastFetchedData = dashboardData;
        window.renderDashboard(dashboardData); // This will now obey Week 7
    }

    fetchCanvasDashboard();
}

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
                    rawDate: asm.due_at ? asm.due_at : null,
                    link: asm.html_url,
                    assignment_id: asm.id, // Useful for unique keys in React/Vue
                    isFinished: isFinished
                };
            };

            if (Array.isArray(courseAssignments)) {
                courseAssignments.forEach(asm => {
                    const item = processItem(asm);
                    if (!item) return;

                    const now = new Date();

                    // If it has a date, it goes into the main list
                    if (item.rawDate) {
                        const d = new Date(item.rawDate);
                        // Check if it's overdue (past now AND unsubmitted)
                        const isOverdue = d < now;
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

        console.log("💾 Saving to Storage:", {
            courses: dashboardData.courses.length,
            overdue: dashboardData.overdue.length,
            upcoming: dashboardData.upcoming.length,
            undated: dashboardData.undated.length
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