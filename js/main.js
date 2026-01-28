// 1. Select the container holding the todo items
const todoContainer = document.querySelector('.todo-item').parentElement;

// 2. Handle the button clicks (Toggle Completion)
todoContainer.addEventListener('click', (event) => {
    const clickedButton = event.target.closest('button');
    if (clickedButton) {
        const parentItem = clickedButton.closest('.todo-item');
        
        // Toggle the 'completed' class
        parentItem.classList.toggle('completed');
        
        // Save state to localStorage so it persists on refresh
        saveTodoState();
    }
});

// 3. Function to save which items are done
function saveTodoState() {
    const completedItems = [];
    document.querySelectorAll('.todo-item').forEach((item, index) => {
        if (item.classList.contains('completed')) {
            completedItems.push(index);
        }
    });
    localStorage.setItem('completedTasks', JSON.stringify(completedItems));
}

// 4. Midnight Check Logic
function checkMidnight() {
    const now = new Date();
    // Check if it is exactly midnight (00:00)
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        // Find all completed items and hide them
        document.querySelectorAll('.todo-item.completed').forEach(item => {
            item.style.display = 'none'; 
        });
        
        // Optional: Clear storage so they stay gone/reset for the new day
        localStorage.removeItem('completedTasks');
    }
}

// Check the time every minute
setInterval(checkMidnight, 60000);

// Run once on load to restore state
window.onload = () => {
    const saved = JSON.parse(localStorage.getItem('completedTasks') || "[]");
    const items = document.querySelectorAll('.todo-item');
    saved.forEach(index => {
        if(items[index]) items[index].classList.add('completed');
    });
};
