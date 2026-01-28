document.getElementById('myButton').addEventListener('click', function(){
    alert('Button clicked!');
});
// Get all class tags
const classTags = document.querySelectorAll(".class-tag");

// URLs for each class (same order as in HTML)
const classLinks = [
    // WILL UPDATE THIS TO CONNECT TO INDIVIDUALS CLASSES WHEN WE GET CONNECTED TO CANVAS API!!!!!!!
  "https://byui.instructure.com/courses/310", // CSE 310
  "https://byui.instructure.com/courses/212", // CSE 212
  "https://example.com" // Placeholder class
];
classTags.forEach((tag, index) => {
  tag.style.cursor = "pointer"; // shows it's clickable

  tag.addEventListener("click", () => {
    window.open(classLinks[index], "_blank");
  });
});
// --- PART A: The Click Handler ---
const todoItems = document.querySelectorAll(".todo-item");

todoItems.forEach(item => {
  const button = item.querySelector("button");

  button.addEventListener("click", () => {
    // Toggle the strike-through class on the text elements
    item.querySelectorAll("h1, h2, p").forEach(el => {
      el.classList.toggle("completed");
    });
    
    // Toggle the button's look
    button.classList.toggle("active");
  });
});

// --- PART B: The Midnight Checker ---
function checkMidnight() {
    const now = new Date();
    
    // Check if it's exactly midnight (Hour 0, Minute 0)
    // We check seconds to ensure it triggers right at the start of the minute
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        todoItems.forEach(item => {
            // Check if this item was marked as completed
            const isDone = item.querySelector("h1").classList.contains("completed");
            
            if (isDone) {
                // Fade out and remove
                item.style.transition = "opacity 0.5s ease";
                item.style.opacity = "0";
                
                setTimeout(() => {
                    item.remove();
                    // Because it's a Flex/Grid layout, 
                    // other items will naturally move up!
                }, 500);
            }
        });
    }
}

// Run the check every 60 seconds
setInterval(checkMidnight, 60000);

