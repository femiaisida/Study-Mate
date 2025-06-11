import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-auth.js";

// Check if user is already signed in
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, redirect to the main site
    window.location.href = "dashboard.html"; // Change this to your actual main page
  }
});

// Login function
document.getElementById("login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Redirect after successful login
      window.location.href = "dashboard.html"; // Change this to your actual main page
    })
    .catch((error) => {
      console.error("Login error:", error.message);
      document.getElementById("error-message").innerText = error.message;
    });
});
