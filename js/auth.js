// js/auth.js
import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-auth.js";

// Protect pages by redirecting if not logged in.
// Include this script on protected pages.
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});

// Export logout functionality.
export function logoutUser() {
  signOut(auth)
    .then(() => window.location.href = "login.html")
    .catch((error) => console.error("Sign out error:", error));
}
