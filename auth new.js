// js/auth new.js
import { auth } from "./firebase-config new.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-auth.js";

// Protect pages by redirecting if no user is signed in.
// Include this script (via <script type="module" src="js/auth new.js"></script>) 
// at the top of every protected page.
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login new.html";
  }
});

// Export logout functionality.
export function logoutUser() {
  signOut(auth)
    .then(() => window.location.href = "login new.html")
    .catch((error) => console.error("Sign out error:", error));
}
