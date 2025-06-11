// js/common.js
document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggle-dark-mode");
  
  // Enable dark mode if saved in local storage.
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }
  
  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem("darkMode", document.body.classList.contains("dark"));
    });
  }
});
