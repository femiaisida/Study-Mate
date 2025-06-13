"use strict";

// Import Firebase Firestore methods from your firebase-config.js
import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.20.0/firebase-firestore.js";

/* 
  Replace localStorage calls with Firebase queries.
  -------------------------------
  Retrieves all flashcards for a given user from Firestore.
*/
async function getAllFlashcards(userId) {
  try {
    const flashcardsRef = collection(db, "flashcards");
    const q = query(flashcardsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching flashcards from Firebase:", e);
    return [];
  }
}

/* 
  Retrieves all tasks for a given user from Firestore.
  (Assumes tasks are stored in a collection named "revisionTasks")
*/
async function getAllTasks(userId) {
  try {
    const tasksRef = collection(db, "revisionTasks");
    const q = query(tasksRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching tasks from Firebase:", e);
    return [];
  }
}

/* 
  Firebase-based study data:
  This function retrieves the study progress data from Firestore.
  If the document doesn't exist, it creates one with default values
  and extra fields: userID and dateCreated.
*/
async function getStudyDataFirebase(uid) {
  try {
    console.log("getStudyDataFirebase called with UID:", uid);
    const studyDocRef = doc(db, "progress", uid);
    const studySnap = await getDoc(studyDocRef);
    if (studySnap.exists()) {
      console.log("Existing study data found:", studySnap.data());
      return studySnap.data();
    } else {
      const initialData = { 
        userID: uid, 
        dateCreated: serverTimestamp(), 
        streak: 0, 
        weekTime: 0,
        monthTime: 0 
      };
      await setDoc(studyDocRef, initialData);
      console.log("Created new study data:", initialData);
      return initialData;
    }
  } catch (error) {
    console.error("Error fetching study data from Firebase:", error);
    return { 
      userID: uid, 
      dateCreated: serverTimestamp(), 
      streak: 0, 
      weekTime: 0, 
      monthTime: 0 
    };
  }
}

/*
  Listen to the study insights document in real time and update the UI.
*/
function listenToStudyInsights(uid) {
  const studyDocRef = doc(db, "progress", uid);
  onSnapshot(studyDocRef, (docSnap) => {
    console.log("onSnapshot triggered for UID:", uid);
    if (docSnap.exists()) {
      console.log("Real-time update received:", docSnap.data());
      updateStudyInsightsUI(docSnap.data());
    } else {
      console.log("No study data found for UID:", uid);
    }
  });
}

/*
  Update the Study Insights UI with data from Firebase.
*/
function updateStudyInsightsUI(studyData) {
  document.getElementById("study-streak").textContent = studyData.streak;
  document.getElementById("study-time-week").textContent = studyData.weekTime;
  document.getElementById("study-time-month").textContent = studyData.monthTime;
}

/*
  Update Task Completion Breakdown Chart using Chart.js.
*/
async function updateTaskBreakdownChart() {
  const tasks = await getAllTasks(window.currentUserUID);
  
  // Group tasks by subject.
  const subjects = {};
  tasks.forEach((task) => {
    // Only consider tasks with a valid subject.
    if (!task.subject || task.subject.trim() === "") return;
    const sub = task.subject;
    if (!subjects[sub]) {
      subjects[sub] = { total: 0, done: 0 };
    }
    subjects[sub].total++;
    if (task.done) {
      subjects[sub].done++;
    }
  });
  
  const labels = Object.keys(subjects);
  const data = labels.map((label) => {
    const obj = subjects[label];
    return obj.total ? Math.round((obj.done / obj.total) * 100) : 0;
  });
  
  const ctx = document.getElementById("tasksChart").getContext("2d");
  // Destroy the old chart instance if needed.
  if (window.tasksChartInstance) {
    window.tasksChartInstance.destroy();
  }
  window.tasksChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "% Completed",
          data: data,
          backgroundColor: "rgba(0, 119, 204, 0.6)",
          borderColor: "rgba(0, 119, 204, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function (value) {
              return value + "%";
            }
          }
        }
      }
    }
  });
}

/*
  Update Memory Strength Scores section.
  Calculates an average "studiedCount" per subject from flashcards.
  Only flashcards with a valid subject are included.
*/
async function updateMemoryStrengthScores() {
  const flashcards = await getAllFlashcards(window.currentUserUID);
  const subjects = {};
  flashcards.forEach((card) => {
    // Only include flashcards that have a defined, non-empty subject.
    if (!card.subject || card.subject.trim() === "") return;
    const sub = card.subject;
    if (!subjects[sub]) {
      subjects[sub] = { total: 0, sum: 0 };
    }
    subjects[sub].total++;
    const count = card.studiedCount || 0;
    subjects[sub].sum += count;
  });
  
  const memoryScoresDiv = document.getElementById("memory-scores");
  let html =
    "<table style='width:100%; border-collapse: collapse;'><tr><th style='border: 1px solid #ddd; padding: 8px;'>Subject</th><th style='border: 1px solid #ddd; padding: 8px;'>Avg. Study Count</th></tr>";
  for (const sub in subjects) {
    const avg = subjects[sub].total
      ? (subjects[sub].sum / subjects[sub].total).toFixed(1)
      : 0;
    html += `<tr><td style='border: 1px solid #ddd; padding: 8px;'>${sub}</td><td style='border: 1px solid #ddd; padding: 8px;'>${avg}</td></tr>`;
  }
  html += "</table>";
  memoryScoresDiv.innerHTML = html;
}

/*
  Update Milestones & Achievements section.
  Checks thresholds for flashcards, tasks, and study streak.
*/
async function updateAchievements() {
  const flashcards = await getAllFlashcards(window.currentUserUID);
  const tasks = await getAllTasks(window.currentUserUID);
  const achievements = [];
  
  if (flashcards.length >= 50)
    achievements.push("Flashcards Master: You've studied 50+ flashcards!");
  if (flashcards.filter((card) => card.studied === true).length >= 25)
    achievements.push("Consistent Reviewer: Studied 25+ flashcards marked as reviewed!");
  if (tasks.filter((task) => task.done === true).length >= 10)
    achievements.push("Task Finisher: Completed 10+ revision tasks!");
  
  if (achievements.length === 0)
    achievements.push("Keep pushing! Your progress will unlock achievements.");
  
  const achDiv = document.getElementById("achievements");
  achDiv.innerHTML = "<ul>" + achievements.map((a) => `<li>${a}</li>`).join("") + "</ul>";
}

/*
  Update Smart Suggestions section.
  Provides recommendations based on flashcards and tasks completion percentages.
  Only includes entries with a valid subject.
*/
async function updateSmartSuggestions() {
  const flashcards = await getAllFlashcards(window.currentUserUID);
  const tasks = await getAllTasks(window.currentUserUID);
  
  const flashcardSubjects = {};
  flashcards.forEach((card) => {
    // Only include flashcards that have a valid subject.
    if (!card.subject || card.subject.trim() === "") return;
    const sub = card.subject;
    if (!flashcardSubjects[sub])
      flashcardSubjects[sub] = { total: 0, completed: 0 };
    flashcardSubjects[sub].total++;
    if (card.studied) flashcardSubjects[sub].completed++;
  });
  
  const suggestions = [];
  for (const sub in flashcardSubjects) {
    const obj = flashcardSubjects[sub];
    const percent = obj.total ? (obj.completed / obj.total) * 100 : 0;
    if (percent < 50) {
      suggestions.push(`Review more flashcards in ${sub} (${Math.round(percent)}% completed).`);
    }
  }
  
  const taskSubjects = {};
  tasks.forEach((task) => {
    // Only include tasks that have a valid subject.
    if (!task.subject || task.subject.trim() === "") return;
    const sub = task.subject;
    if (!taskSubjects[sub])
      taskSubjects[sub] = { total: 0, done: 0 };
    taskSubjects[sub].total++;
    if (task.done) taskSubjects[sub].done++;
  });
  
  for (const sub in taskSubjects) {
    const obj = taskSubjects[sub];
    const percent = obj.total ? (obj.done / obj.total) * 100 : 0;
    if (percent < 50) {
      suggestions.push(`Schedule a revision for ${sub} tasks (${Math.round(percent)}% completed).`);
    }
  }
  
  if (suggestions.length === 0)
    suggestions.push("Great job! All subjects are progressing well.");
  
  const recDiv = document.getElementById("recommendations");
  recDiv.innerHTML = "<ul>" + suggestions.map((s) => `<li>${s}</li>`).join("") + "</ul>";
}

/*
  AUTOMATIC REVISION TASK CREATION
  This function checks if the current user has any revision tasks in Firestore.
  If none exist, it automatically creates a default revision task.
*/
async function ensureRevisionTasks(userId) {
  const tasks = await getAllTasks(userId);
  if (tasks.length === 0) {
    try {
      const defaultTask = {
        userId: userId,
        subject: "General", // Default subject; adjust if needed.
        done: false,
        description: "This is your default revision task. Edit or mark as done once completed.",
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "revisionTasks"), defaultTask);
      console.log("Default revision task created for user:", userId);
    } catch (error) {
      console.error("Error creating default revision task:", error);
    }
  }
}

/*
  Overall function to update the dashboard.
  It ensures that a study progress document exists for the current user,
  then sets up the Firebase real-time listener for study insights and updates the other sections.
*/
async function updateProgressDashboard() {
  console.log("updateProgressDashboard called, currentUserUID:", window.currentUserUID);
  
  // Update non-Firebase UI elements (using Firebase data):
  await updateTaskBreakdownChart();
  await updateMemoryStrengthScores();
  await updateAchievements();
  await updateSmartSuggestions();
  
  // Ensure at least one revision task exists automatically.
  await ensureRevisionTasks(window.currentUserUID);
  
  // For study insights, get or create study data before setting up the real-time listener.
  if (window.currentUserUID) {
    getStudyDataFirebase(window.currentUserUID)
      .then((data) => {
        console.log("Study data retrieved/created:", data);
        listenToStudyInsights(window.currentUserUID);
      })
      .catch((error) => {
         console.error("Error retrieving/creating study data:", error);
      });
  } else {
    // If no UID, fall back to default display.
    updateStudyInsightsUI({ streak: 0, weekTime: 0, monthTime: 0 });
  }
}

// Wait for DOM loaded, then poll until window.currentUserUID is set before updating the dashboard.
document.addEventListener("DOMContentLoaded", () => {
  const uidChecker = setInterval(() => {
    if (window.currentUserUID) {
      clearInterval(uidChecker);
      updateProgressDashboard();
    }
  }, 100);
});

// (Optional) Export updateProgressDashboard if you want to call it from elsewhere.
export { updateProgressDashboard };

// Expose getStudyDataFirebase globally for testing in the console.
window.getStudyDataFirebase = getStudyDataFirebase;
