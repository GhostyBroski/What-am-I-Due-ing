document.addEventListener("DOMContentLoaded", () => {

  // 1. Class Tag Redirects
  const classTags = document.querySelectorAll(".class-tag");
  const classLinks = [
    "https://byui.instructure.com/courses/310",
    "https://byui.instructure.com/courses/212",
    "https://byui.instructure.com/courses/999" // Fallback link
  ];

  classTags.forEach((tag, index) => {
    tag.addEventListener("click", () => {
      // Use index to pick link, default to Canvas home if out of bounds
      const url = classLinks[index] || "https://byui.instructure.com/";
      window.open(url, "_blank");
    });
  });

  const todoItems = document.querySelectorAll(".todo-item");

todoItems.forEach(item => {
    const button = item.querySelector(".myButton");
    if (!button) return;

    button.addEventListener("click", (e) => {
        e.stopPropagation(); 

        // 1. Toggle the visual state of the card
        item.classList.toggle("completed");
        
        // 2. Toggle the button's red/active color
        button.classList.toggle("active");
        
        // 3. Optional: Toggle 'done' if you use that for other logic
        item.classList.toggle("done");
    });
});

  // 3. The Midnight Checker (Moved inside so it can access todoItems)
  function checkMidnight() {
    const now = new Date();
    
    // Check if it's 00:00 (Midnight)
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        console.log("Midnight cleanup triggered...");
        
        todoItems.forEach(item => {
            // Check if the h1 inside this item has the 'completed' class
            const title = item.querySelector("h1");
            if (title && title.classList.contains("completed")) {
                
                // Visual Fade Out
                item.style.transition = "opacity 0.5s ease, transform 0.5s ease";
                item.style.opacity = "0";
                item.style.transform = "translateX(20px)";
                
                setTimeout(() => {
                    item.remove();
                }, 500);
            }
        });
    }
  }

  // Run the check every 60 seconds
  setInterval(checkMidnight, 60000);
});