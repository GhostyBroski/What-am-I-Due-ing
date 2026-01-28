//  Select the container holding the todo items
const todoContainer = document.querySelector('.todo-item').parentElement;

//  Handle the button clicks (Toggle Completion)
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

// Function to save which items are done
function saveTodoState() {
    const completedItems = [];
    document.querySelectorAll('.todo-item').forEach((item, index) => {
        if (item.classList.contains('completed')) {
            completedItems.push(index);
        }
    });
    localStorage.setItem('completedTasks', JSON.stringify(completedItems));
}

//  Midnight Check 
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
//  Select all class-tag elements
const classTags = document.querySelectorAll('.class-tag');

classTags.forEach(tag => {
    //  Add a click listener to each tag
    tag.addEventListener('click', () => {
        // Replace with your actual Canvas URL
        const canvasUrl = "https://byui.instructure.com/"; 
        
        //  Open Canvas in a new tab
        window.open(canvasUrl, '_blank');
    });

    //  Change cursor to pointer so users know it's clickable
    tag.style.cursor = 'pointer';
});
