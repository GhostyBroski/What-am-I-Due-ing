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
