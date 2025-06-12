// js/auth.js
import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-auth.js";

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.log("User not logged in, redirecting to login page.");
    window.location.href = "login.html"; // Redirect unauthenticated users
  } else {
    console.log(`User logged in: ${user.email}`);
    displayAuthButtons(user);
  }
});

// Manage the display of login/logout buttons
function displayAuthButtons(user) {
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");

  // When logged in, hide the login button and show the logout button.
  if (user) {
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "block";
    logoutBtn.addEventListener("click", () => {
      signOut(auth)
        .then(() => {
          window.location.href = "login.html";
        })
        .catch((error) => {
          console.error("Error signing out:", error);
        });
    });
  } else {
    if (loginBtn) loginBtn.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}
