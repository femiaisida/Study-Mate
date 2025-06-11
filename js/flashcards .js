// js/flashcards.js
"use strict";

import { db } from "./firebase-config.js";
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
 * Adds a new flashcard to Firestore.
 * @param {string} userId - The user’s UID.
 * @param {string} subject - Flashcard subject.
 * @param {string} question - The question.
 * @param {string} answer - The answer.
 */
export async function addFlashcard(userId, subject, question, answer) {
  try {
    const docRef = await addDoc(collection(db, "flashcards"), {
      userId,
      subject,
      question,
      answer,
      studied: false,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding flashcard:", error);
  }
}

/**
 * Retrieves flashcards for a given user from Firestore.
 * @param {string} userId - The user’s UID.
 * @returns {Array} Array of flashcard documents.
 */
export async function getUserFlashcards(userId) {
  try {
    const q = query(collection(db, "flashcards"), where("userId", "==", userId));
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
 * Deletes a flashcard from Firestore.
 * @param {string} cardId - The flashcard document ID.
 */
export async function deleteFlashcard(cardId) {
  try {
    await deleteDoc(doc(db, "flashcards", cardId));
  } catch (error) {
    console.error("Error deleting flashcard:", error);
  }
}

/**
 * Marks a flashcard as studied in Firestore.
 * @param {string} cardId - The flashcard document ID.
 */
export async function markFlashcardStudied(cardId) {
  try {
    await updateDoc(doc(db, "flashcards", cardId), { studied: true });
  } catch (error) {
    console.error("Error updating flashcard:", error);
  }
}
