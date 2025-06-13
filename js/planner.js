// js/planner.js
"use strict";

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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.20.0/firebase-firestore.js";

// Wait for the DOM to load before accessing elements.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("planner-form");
  const taskInput = document.getElementById("task");
  const dueDateInput = document.getElementById("due-date");
  const taskList = document.getElementById("planner-list");

  // If any required planner elements are missing, log a warning and don't initialize.
  if (!form || !taskInput || !dueDateInput || !taskList) {
    console.warn("Planner UI elements not found. Skipping planner.js initialization.");
    return;
  }

  let tasks = [];

  function getDaysLeft(dueDateString) {
    const today = new Date();
    const dueDate = new Date(dueDateString);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  async function fetchTasksFromFirestore() {
    if (!window.currentUserUID) {
      console.warn("No user UID found. Make sure you are authenticated.");
      return;
    }
    try {
      const q = query(
        collection(db, "revisionTasks"),
        where("userId", "==", window.currentUserUID)
      );
      const snapshot = await getDocs(q);
      tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched tasks:", tasks);
      displayTasks();
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }

  function displayTasks() {
    taskList.innerHTML = "";
    tasks.forEach((task) => {
      const diffDays = getDaysLeft(task.dueDate);
      const daysLeftText =
        diffDays >= 0 ? `${diffDays} day(s) left` : "Past due";
      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <input type="checkbox" ${task.done ? "checked" : ""} onchange="toggleDone('${task.id}')">
          <span class="${task.done ? 'done' : ''}">${task.text}</span>
          <span class="due-date">${daysLeftText}</span>
        </div>
        <button onclick="deleteTask('${task.id}')" class="btn">🗑️</button>
      `;
      taskList.appendChild(li);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Form submit event triggered");
    const text = taskInput.value.trim();
    const dueDate = dueDateInput.value;
    console.log(
      "Values:",
      "text:",
      text,
      "dueDate:",
      dueDate,
      "currentUserUID:",
      window.currentUserUID
    );
    if (!text || !dueDate) {
      console.warn("Task text or due date is missing");
      return;
    }
    if (!window.currentUserUID) {
      console.error("User is not authenticated. Cannot add task.");
      return;
    }
    try {
      await addDoc(collection(db, "revisionTasks"), {
        userId: window.currentUserUID,
        text,
        subject: "General", // Adjust if needed.
        done: false,
        dueDate,
        createdAt: serverTimestamp(),
      });
      console.log("Task added to Firestore");
      taskInput.value = "";
      dueDateInput.value = "";
      await fetchTasksFromFirestore();
    } catch (err) {
      console.error("Error adding task:", err);
    }
  });

  async function toggleDone(taskId) {
    console.log("toggleDone called for task:", taskId);
    try {
      const ref = doc(db, "revisionTasks", taskId);
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        console.error("Task not found:", taskId);
        return;
      }
      await updateDoc(ref, { done: !task.done });
      console.log(`Task ${taskId} updated (done toggled)`);
      await fetchTasksFromFirestore();
    } catch (err) {
      console.error("Error updating task:", err);
    }
  }

  async function deleteTask(taskId) {
    console.log("deleteTask called for task:", taskId);
    try {
      await deleteDoc(doc(db, "revisionTasks", taskId));
      console.log(`Task ${taskId} deleted`);
      await fetchTasksFromFirestore();
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  }

  // Expose functions globally for inline event handlers.
  window.toggleDone = toggleDone;
  window.deleteTask = deleteTask;

  // Poll for user authentication before fetching tasks.
  const checkUID = setInterval(() => {
    if (window.currentUserUID) {
      clearInterval(checkUID);
      fetchTasksFromFirestore();
    } else {
      console.log("Waiting for user UID...");
    }
  }, 100);
});
