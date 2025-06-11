// js/flashcards new.js
"use strict";

import { db } from "./firebase-config new.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.20.0/firebase-firestore.js";

/**
 * Add a new flashcard.
 * @param {string} ownerUID - The user's UID.
 * @param {string} subject - The flashcard's subject.
 * @param {string} question - The question text.
 * @param {string} answer - The answer text.
 */
export async function addFlashcard(ownerUID, subject, question, answer) {
  try {
    const docRef = await addDoc(collection(db, "flashcards"), {
      owner: ownerUID,
      subject: subject,
      question: question,
      answer: answer,
      studied: false,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding flashcard:", error);
  }
}

/**
 * Retrieve flashcards for a given user.
 * @param {string} ownerUID - The user's UID.
 * @returns {Array} Array of flashcard documents.
 */
export async function getFlashcards(ownerUID) {
  try {
    const q = query(collection(db, "flashcards"), where("owner", "==", ownerUID));
    const querySnapshot = await getDocs(q);
    let flashcards = [];
    querySnapshot.forEach((document) => {
      flashcards.push({ id: document.id, ...document.data() });
    });
    return flashcards;
  } catch (error) {
    console.error("Error getting flashcards:", error);
    return [];
  }
}

/**
 * Delete a flashcard by its document ID.
 * @param {string} cardId - Document ID.
 */
export async function deleteFlashcard(cardId) {
  try {
    await deleteDoc(doc(db, "flashcards", cardId));
  } catch (error) {
    console.error("Error deleting flashcard:", error);
  }
}

/**
 * Mark a flashcard as studied.
 * @param {string} cardId - Document ID.
 */
export async function markFlashcardStudied(cardId) {
  try {
    await updateDoc(doc(db, "flashcards", cardId), { studied: true });
  } catch (error) {
    console.error("Error updating flashcard:", error);
  }
}
