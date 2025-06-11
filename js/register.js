import { auth, db } from "./js/firebase-config.js";

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/9.20.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-firestore.js";

// Register function
document.getElementById("register-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    // Create user with email & password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with name
    await updateProfile(user, { displayName: name });

    // Store user details in Firestore under the `users` collection
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      createdAt: new Date(),
    });

    // Redirect to main site after successful registration
    window.location.href = "dashboard.html"; // Change this to your actual main page

  } catch (error) {
    console.error("Registration error:", error.message);
    document.getElementById("error-message").innerText = error.message;
  }
});
