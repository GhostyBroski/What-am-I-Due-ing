// Wrap everything in a check to ensure the HTML is loaded first
document.addEventListener('DOMContentLoaded', () => {

    // 1. Handle clicking the buttons in the Todo items
    // We target the main body and listen for clicks on any button
    document.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('button');
        
        // Ensure it's one of your "myButton" buttons
        if (clickedButton && clickedButton.id === 'myButton') {
            const parentItem = clickedButton.closest('.todo-item');
            
            // Toggle the 'completed' class on the whole section
            parentItem.classList.toggle('completed');
            
            saveTodoState();
        }
    });

    // 2. Class-Tag Redirects to Canvas
    const classTags = document.querySelectorAll('.class-tag');
    classTags.forEach(tag => {
        tag.style.cursor = 'pointer';
        tag.addEventListener('click', () => {
            window.open("https://byui.instructure.com/", '_blank');
        });
    });

    // 3. Save which items are checked to local storage
    function saveTodoState() {
        const completedStates = [];
        document.querySelectorAll('.todo-item').forEach((item, index) => {
            completedStates.push(item.classList.contains('completed'));
        });
        localStorage.setItem('todoStorage', JSON.stringify(completedStates));
    }

    // 4. Restore the checks when the page refreshes
    function loadTodoState() {
        const savedStates = JSON.parse(localStorage.getItem('todoStorage') || "[]");
        document.querySelectorAll('.todo-item').forEach((item, index) => {
            if (savedStates[index]) {
                item.classList.add('completed');
            }
        });
    }

    // 5. Midnight Cleanup Logic
    function checkMidnight() {
        const now = new Date();
        if (now.getHours() === 0 && now.getMinutes() === 0) {
            document.querySelectorAll('.todo-item.completed').forEach(item => {
                item.style.display = 'none'; // Item disappears
            });
            localStorage.removeItem('todoStorage'); // Clear the "done" list
        }
    }

    // Initialize the page
    loadTodoState();
    setInterval(checkMidnight, 60000); // Check the clock every minute
});