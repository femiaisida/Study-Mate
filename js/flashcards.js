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
 * Adds a new flashcard to Firestore.
 * Security rules require that the userId field matches the authenticated user's UID.
 *
 * @param {string} userId - The current user's UID.
 * @param {string} subject - The flashcard's subject.
 * @param {string} question - The flashcard question.
 * @param {string} answer - The flashcard answer.
 * @returns {Promise<string|undefined>} The new document ID if successful.
 */
export async function addFlashcard(userId, subject, question, answer) {
  try {
    console.log("Attempting to add flashcard for user:", userId);
    const cardData = {
      userId,            // Must match request.auth.uid for Firestore rules.
      subject,
      question,
      answer,
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, "flashcards"), cardData);
    console.log("Flashcard successfully added with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding flashcard:", error);
  }
}

/**
 * Retrieves flashcards for a given user from Firestore.
 *
 * @param {string} userId - The current user's UID.
 * @returns {Promise<Array>} An array of flashcard objects.
 */
export async function getFlashcards(userId) {
  try {
    const flashcardQuery = query(
      collection(db, "flashcards"),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(flashcardQuery);
    const cards = [];
    querySnapshot.forEach((docSnap) => {
      cards.push({ id: docSnap.id, ...docSnap.data() });
    });
    return cards;
  } catch (error) {
    console.error("Error retrieving flashcards:", error);
    return [];
  }
}

/**
 * Deletes a flashcard from Firestore.
 *
 * @param {string} cardId - The Firestore document ID of the flashcard.
 */
export async function deleteFlashcard(cardId) {
  try {
    await deleteDoc(doc(db, "flashcards", cardId));
    console.log("Flashcard deleted:", cardId);
  } catch (error) {
    console.error("Error deleting flashcard:", error);
  }
}
