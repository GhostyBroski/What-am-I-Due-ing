# What-am-I-Due-ing
A browser extension for your To-Do needs!

**Load in Chrome:**
Open Chrome and go to chrome://extensions/.
Enable Developer Mode (top right).
Click Load unpacked and select the folder containing your extension files.

**How to Use**
-Viewing Tasks: Click the extension icon to open your dashboard. The extension will show "Syncing with Canvas..." while it fetches the latest data.

-Filtering: Click the slider button next to the "Assignments" heading to hide assignments you have already submitted.

-Navigating Categories: Click the left or right icons in the "Assignments" header to switch to Announcements or Calendar views.

-Checking Progress: Look at the Progress Rings section. Each colored ring represents a different course; a full ring means all tracked assignments for that course are done.


**Features**
1. Live Canvas Sync
The extension automatically scrapes and syncs data from two sources:

Global Dashboard: Tracks the "To-Do" sidebar on the main Canvas dashboard.

Course Pages: Scrapes specific assignment lists when you visit individual course pages.

API Integration: Uses a Canvas Access Token to pull real-time data on active courses, overdue assignments, and upcoming deadlines.

2. Interactive Assignment Dashboard
Status Slider: Toggle between viewing all assignments or only pending/unsubmitted tasks.

Visual Progress Rings: Multi-layered SVG rings that visualize your completion percentage for each course.

Weekly Navigation: View assignments organized by semester weeks (e.g., Week 7).

Category Switching: Quickly cycle between Assignments, Announcements, and Calendar views using the header navigation.

3. Smart Task Management
Manual Completion: Toggle a "check-off" state on tasks for immediate visual feedback.

Midnight Cleanup: An automated system that "cleans" your dashboard every night at midnight, fading out and removing tasks marked as completed.

Course Tooltips: Hover over course tags to see the full course name (e.g., "CSE 310" → "Applied Programming").
