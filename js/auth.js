"use strict";

import { auth, googleProvider } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from "https://www.gstatic.com/firebasejs/9.20.0/firebase-auth.js";
import { displayFlashcards } from "./flashcards.js";

/* ------------------------------
   Authentication State Handler
------------------------------- */
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.currentUserUID = user.uid;
    updateAuthButtons(user);

    const flashcards = document.getElementById("flashcards-list");
    const spinner = document.getElementById("loading-spinner");
    if (flashcards && spinner) {
      if (document.readyState === "complete") {
        displayFlashcards(user.uid);
      } else {
        window.addEventListener("load", () => displayFlashcards(user.uid));
      }
    }
  } else if (!window.publicPage) {
    window.location.href = "login.html";
  }
});

/* ------------------------------
   Google Sign-In
------------------------------- */
export function signInWithGoogle() {
  signInWithPopup(auth, googleProvider)
    .then((result) => {
      console.log("User signed in with Google:", result.user);
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      console.error("Error during Google sign-in:", error);
      showToast(error.message, "error");
    });
}

/* ------------------------------
   Phone Sign-In
------------------------------- */
let recaptchaVerifier;
function setupRecaptcha() {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => console.log("reCAPTCHA verified"),
        "expired-callback": () => console.warn("reCAPTCHA expired")
      },
      auth
    );
    recaptchaVerifier.render();
  }
}

export function signInWithPhone(phoneNumber) {
  setupRecaptcha();
  signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
    .then((confirmationResult) => {
      window.confirmationResult = confirmationResult;
      showVerificationModal();
    })
    .catch((error) => {
      console.error("Phone sign-in error:", error);
      showToast(error.message, "error");
    });
}

/* ------------------------------
   Show Custom Verification Modal
------------------------------- */
function showVerificationModal() {
  const modal = document.getElementById("verification-modal");
  const codeInput = document.getElementById("verification-code-input");
  const verifyBtn = document.getElementById("verify-code-btn");
  const cancelBtn = document.getElementById("cancel-verification-btn");
  const errorDisplay = document.getElementById("verification-error");

  if (!modal || !codeInput || !verifyBtn || !cancelBtn) {
    console.warn("Modal elements not found.");
    return;
  }

  modal.classList.remove("hidden");
  codeInput.value = "";
  errorDisplay.textContent = "";
  codeInput.focus();

  verifyBtn.onclick = () => {
    const code = codeInput.value.trim();
    if (code.length < 4) {
      errorDisplay.textContent = "Please enter a valid verification code.";
      return;
    }
    window.confirmationResult
      .confirm(code)
      .then((result) => {
        console.log("Phone sign-in successful:", result.user);
        modal.classList.add("hidden");
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        console.error("Verification failed:", error);
        showToast("Invalid verification code. Please try again.", "error");
        errorDisplay.textContent = "Invalid code. Please try again.";
      });
  };

  cancelBtn.onclick = () => {
    modal.classList.add("hidden");
    errorDisplay.textContent = "";
  };
}

/* ------------------------------
   Button Event Listeners
------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.getElementById("google-signin-btn");
  const phoneBtn = document.getElementById("phone-signin-btn");
  const phoneInput = document.getElementById("phone-number-input");

  if (googleBtn) {
    googleBtn.addEventListener("click", signInWithGoogle);
  }
  if (phoneBtn && phoneInput) {
    phoneBtn.addEventListener("click", () => {
      const phoneNumber = phoneInput.value.trim();
      if (!phoneNumber.startsWith("+") || phoneNumber.length < 10) {
        showToast("Please enter a valid phone number (e.g., +1234567890).", "error");
        return;
      }
      signInWithPhone(phoneNumber);
    });
  }
});

/* ------------------------------
   Update Auth Buttons
------------------------------- */
function updateAuthButtons(user) {
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  if (user) {
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) {
      logoutBtn.style.display = "block";
      logoutBtn.onclick = () => {
        signOut(auth)
          .then(() => (window.location.href = "login.html"))
          .catch((error) => {
            console.error("Sign-out error:", error);
            showToast("There was a problem signing out.", "error");
          });
      };
    }
  } else {
    if (loginBtn) loginBtn.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

/* ------------------------------
   Toast Notification Function
------------------------------- */
function showToast(message, type = "error", duration = 3000) {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

// Expose showToast globally so inline scripts can use it.
window.showToast = showToast;
