"use strict";

// Import Firebase Firestore methods from your firebase-config.js
import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/9.20.0/firebase-firestore.js";

/**
 * Retrieves all flashcards for the given user from Firestore.
 */
export async function getFlashcards(userId) {
  if (!userId) {
    console.error("Error fetching flashcards: userId is undefined");
    return [];
  }
  try {
    const q = query(collection(db, "flashcards"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error fetching flashcards:", err);
    return [];
  }
}

/**
 * Displays all flashcards for the authenticated user.
 * It retrieves flashcards, optionally filters them based on the filter input,
 * and renders them into the DOM.
 */
export async function displayFlashcards(userId) {
  if (!userId) {
    console.error("displayFlashcards: userId is undefined");
    return;
  }

  const flashcardsList = document.getElementById("flashcards-list");
  const loader = document.getElementById("loading-spinner");
  if (!flashcardsList || !loader) {
    console.error("displayFlashcards: Missing flashcardsList or loader element.");
    return;
  }

  loader.style.display = "block";
  flashcardsList.innerHTML = "";

  // Retrieve flashcards from Firestore.
  const cards = await getFlashcards(userId);
  loader.style.display = "none";

  // Expose the data globally for testing.
  window.cardsData = cards;
  console.log("Total cards retrieved from Firestore:", cards.length);

  // Get filter text (if available)
  const filterInput = document.getElementById("flashcard-filter");
  let filterText = "";
  if (filterInput) {
    filterText = filterInput.value.trim().toLowerCase();
  }

  // Render only cards that match the filter if provided
  cards.forEach((card) => {
    // If filter text exists and card.subject does not include it, skip this card.
    if (filterText && !card.subject.toLowerCase().includes(filterText)) {
      return;
    }

    const cardDiv = document.createElement("div");
    cardDiv.classList.add("flashcard");
    cardDiv.innerHTML = `
      <div class="flashcard-inner" onclick="flipCard(this)">
        <div class="flashcard-front">
          <p class="flashcard-subject"><strong>Subject:</strong> ${card.subject}</p>
          <p class="flashcard-question"><strong>Question:</strong> ${card.question}</p>
          <p class="flashcard-studiedTime"><strong>Studied Hours:</strong> ${card.studiedTime ? card.studiedTime.toFixed(2) : 0}</p>
        </div>
        <div class="flashcard-back">
          <p><strong>Answer:</strong> ${card.answer}</p>
        </div>
      </div>
      <button data-id="${card.id}" class="delete-btn btn" onclick="deleteCard(event, '${card.id}')">Delete</button>
    `;
    flashcardsList.appendChild(cardDiv);
  });
}

/**
 * Adds a new flashcard for the given user in Firestore.
 */
export async function addFlashcard(userId, subject, question, answer) {
  try {
    // Auto-capitalize subject.
    subject = subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();
    const data = {
      userId,
      subject,
      question,
      answer,
      studiedTime: 0, // Initialize studied time to 0 hours.
      createdAt: new Date()
    };
    const ref = await addDoc(collection(db, "flashcards"), data);
    console.log("Flashcard added:", ref.id);
    return ref.id;
  } catch (err) {
    console.error("Error adding flashcard:", err);
  }
}

/**
 * Deletes a flashcard from Firestore given its document ID.
 */
export async function deleteFlashcard(cardId) {
  try {
    await deleteDoc(doc(db, "flashcards", cardId));
    console.log("Flashcard deleted:", cardId);
  } catch (err) {
    console.error("Error deleting flashcard:", err);
  }
}

/**
 * Updates the flashcard's studied time by incrementing it with the specified hours.
 * After updating, it refreshes the flashcards UI.
 */
export async function updateFlashcardStudyTime(flashcardId, hours) {
  try {
    const flashcardRef = doc(db, "flashcards", flashcardId);
    await updateDoc(flashcardRef, {
      studiedTime: increment(hours)
    });
    console.log(`Updated flashcard ${flashcardId}: incremented studiedTime by ${hours} hour(s).`);

    // Refresh the flashcards UI after updating.
    if (window.currentUserUID) {
      displayFlashcards(window.currentUserUID);
    }
  } catch (err) {
    console.error("Error updating flashcard studiedTime:", err);
  }
}

// Expose global functions for inline event handlers.
window.flipCard = function(el) {
  el.classList.toggle("flipped");
};

window.deleteCard = async function(event, cardId) {
  event.stopPropagation();
  const flashcardElement = event.target.closest(".flashcard");
  if (flashcardElement) {
    flashcardElement.classList.add("removing");
    setTimeout(async () => {
      await deleteFlashcard(cardId);
      if (window.currentUserUID) {
        displayFlashcards(window.currentUserUID);
      }
    }, 500);
  }
};

// Wait until the DOM is loaded to attach event listeners.
document.addEventListener("DOMContentLoaded", () => {
  // Event listener for form submission to add new flashcards.
  const form = document.getElementById("flashcard-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const subject = document.getElementById("flashcard-subject").value.trim();
      const question = document.getElementById("flashcard-question").value.trim();
      const answer = document.getElementById("flashcard-answer").value.trim();
      if (subject && question && answer && window.currentUserUID) {
        await addFlashcard(window.currentUserUID, subject, question, answer);
        form.reset();
        displayFlashcards(window.currentUserUID);
      } else {
        console.error("Missing input or user not authenticated");
      }
    });
  }

  // Event listener for filtering flashcards by subject.
  const filterInput = document.getElementById("flashcard-filter");
  if (filterInput) {
    filterInput.addEventListener("input", () => {
      if (window.currentUserUID) {
        displayFlashcards(window.currentUserUID);
      }
    });
  }
});

// Expose the update function globally for testing purposes.
window.updateFlashcardStudyTime = updateFlashcardStudyTime;
