"use strict";

import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-auth.js";
import { displayFlashcards } from "./flashcards.js";

// Listen for authentication state changes.
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log(`User logged in: ${user.email}`);
    // Set the global user UID so that other modules (like planner.js) can use it.
    window.currentUserUID = user.uid;
    updateAuthButtons(user);

    // Only trigger flashcards loading if the required elements exist.
    if (
      document.getElementById("flashcards-list") &&
      document.getElementById("loading-spinner")
    ) {
      // If the document is already loaded, call displayFlashcards immediately;
      // otherwise, wait for the 'load' event.
      if (document.readyState === "complete") {
        displayFlashcards(user.uid);
      } else {
        window.addEventListener("load", () => {
          displayFlashcards(user.uid);
        });
      }
    }
  } else {
    console.log("User not logged in, redirecting to login page.");
    window.location.href = "login.html";
  }
});

// Update the UI to show/hide login and logout buttons.
function updateAuthButtons(user) {
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");

  if (user) {
    if (loginBtn) {
      loginBtn.style.display = "none";
    }
    if (logoutBtn) {
      logoutBtn.style.display = "block";
      // Clear any previous listener to prevent multiple bindings.
      logoutBtn.onclick = () => {
        signOut(auth)
          .then(() => {
            window.location.href = "login.html";
          })
          .catch((error) => console.error("Error signing out:", error));
      };
    }
  } else {
    if (loginBtn) {
      loginBtn.style.display = "block";
    }
    if (logoutBtn) {
      logoutBtn.style.display = "none";
    }
  }
}
