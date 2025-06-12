// js/flashcards.js

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.20.0/firebase-firestore.js";

/** 
 * Display all flashcards for the authenticated user.
 * If a subject filter (input#flashcard-filter) is provided, only matching
 * flashcards are rendered. A loading spinner is shown while fetching.
 */
export async function displayFlashcards(userId) {
  const flashcardsList = document.getElementById("flashcards-list");
  const loader = document.getElementById("loading-spinner");
  if (!userId || !flashcardsList || !loader) return;

  loader.style.display = "block";
  flashcardsList.innerHTML = "";
  
  const cards = await getFlashcards(userId);
  loader.style.display = "none";

  // Apply subject filter if provided
  const filterInput = document.getElementById("flashcard-filter");
  let filteredCards = cards;
  if (filterInput && filterInput.value.trim() !== "") {
    const filterText = filterInput.value.trim().toLowerCase();
    filteredCards = cards.filter(card =>
      card.subject.toLowerCase().includes(filterText)
    );
  }

  filteredCards.forEach((card) => {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("flashcard");
  cardDiv.innerHTML = `
  <div class="flashcard-inner" onclick="flipCard(this)">
    <div class="flashcard-front">
      <p class="flashcard-subject"><strong>Subject:</strong> ${card.subject}</p>
      <p class="flashcard-question"><strong>Question:</strong> ${card.question}</p>
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
 * Adds a new flashcard for the given user.
 * The subject field is auto-capitalized (first letter uppercase, rest lower-case).
 */
export async function addFlashcard(userId, subject, question, answer) {
  try {
    // Auto capitalize subject
    subject = subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();
    const data = {
      userId,
      subject,
      question,
      answer,
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
 * Retrieves all flashcards for the given user from Firestore.
 */
export async function getFlashcards(userId) {
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
 * Global function to flip a flashcard.
 * Called via inline onclick on the .flashcard-inner element.
 */
window.flipCard = function (el) {
  el.classList.toggle("flipped");
};

/**
 * Global function to delete a flashcard with an animation.
 * Adds a 'removing' class to trigger a CSS animation before deletion.
 */
window.deleteCard = async function (event, cardId) {
  event.stopPropagation();
  const flashcardElement = event.target.closest('.flashcard');
  if (flashcardElement) {
    // Add CSS class for delete-animation (e.g. fade out, slide up)
    flashcardElement.classList.add("removing");
    // Wait for the animation to complete (assume 500ms)
    setTimeout(async () => {
      await deleteFlashcard(cardId);
      if (window.currentUserUID) displayFlashcards(window.currentUserUID);
    }, 500);
  }
};

/**
 * Attach event listeners on DOMContentLoaded for form submission and filtering.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Handle form submission for adding new flashcards
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

  // Attach filter listener for flashcards by subject
  const filterInput = document.getElementById("flashcard-filter");
  if (filterInput) {
    filterInput.addEventListener("input", () => {
      if (window.currentUserUID) displayFlashcards(window.currentUserUID);
    });
  }
});
