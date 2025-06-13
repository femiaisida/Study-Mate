// js/theme.js
document.addEventListener("DOMContentLoaded", () => {
  const themeSelector = document.getElementById("themeSelector");
  
  if (!themeSelector) {
    console.warn("Theme selector element not found.");
    return;
  }
  
  // Check localStorage for a saved theme; default to "default" if none is found.
  const savedTheme = localStorage.getItem("selectedTheme") || "default";
  
  if (savedTheme !== "default") {
    document.body.classList.add("theme-" + savedTheme);
  }
  // Ensure the theme selector reflects the saved theme
  themeSelector.value = savedTheme;
  
  // Listen for changes on the theme selector
  themeSelector.addEventListener("change", () => {
    // Remove any existing "theme-" classes from the body
    document.body.classList.forEach((cls) => {
      if (cls.startsWith("theme-")) {
        document.body.classList.remove(cls);
      }
    });
    
    // Get the selected theme and update the body's classes accordingly
    const selectedTheme = themeSelector.value;
    if (selectedTheme !== "default") {
      document.body.classList.add("theme-" + selectedTheme);
    }
    
    // Save the new theme selection in localStorage
    localStorage.setItem("selectedTheme", selectedTheme);
  });
});
