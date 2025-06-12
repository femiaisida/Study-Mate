"use strict";

// Import Firebase Firestore methods from your firebase-config.js
import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.20.0/firebase-firestore.js";

/* 
  The following functions still use localStorage to get flashcards and tasks.
  You can later rewrite them to pull data from Firebase if needed.
*/
function getAllFlashcards() {
  try {
    return JSON.parse(localStorage.getItem("flashcards")) || [];
  } catch (e) {
    return [];
  }
}

function getAllTasks() {
  try {
    return JSON.parse(localStorage.getItem("revisionTasks")) || [];
  } catch (e) {
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
    const studyDocRef = doc(db, "progress", uid);
    const studySnap = await getDoc(studyDocRef);
    if (studySnap.exists()) {
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
    if (docSnap.exists()) {
      updateStudyInsightsUI(docSnap.data());
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
function updateTaskBreakdownChart() {
  const tasks = getAllTasks();

  // Group tasks by subject
  const subjects = {};
  tasks.forEach((task) => {
    const sub = task.subject || "Unknown";
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
  // Destroy the old chart instance if needed
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
            },
          },
        },
      },
    },
  });
}

/*
  Update Memory Strength Scores section.
  Calculates an average "studiedCount" per subject from flashcards.
*/
function updateMemoryStrengthScores() {
  const flashcards = getAllFlashcards();
  const subjects = {};
  flashcards.forEach((card) => {
    const sub = card.subject || "Unknown";
    if (!subjects[sub]) {
      subjects[sub] = { total: 0, sum: 0 };
    }
    subjects[sub].total++;
    // Use 'studiedCount' if available; otherwise default to 0.
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
function updateAchievements() {
  const flashcards = getAllFlashcards();
  const tasks = getAllTasks();
  const achievements = [];

  if (flashcards.length >= 50)
    achievements.push("Flashcards Master: You've studied 50+ flashcards!");
  if (flashcards.filter((card) => card.studied === true).length >= 25)
    achievements.push("Consistent Reviewer: Studied 25+ flashcards marked as reviewed!");
  if (tasks.filter((task) => task.done === true).length >= 10)
    achievements.push("Task Finisher: Completed 10+ revision tasks!");

  // The study streak is updated via Firebase study data.
  // For example, if the streak is updated in the study insights realtime listener.

  if (achievements.length === 0)
    achievements.push("Keep pushing! Your progress will unlock achievements.");

  const achDiv = document.getElementById("achievements");
  achDiv.innerHTML = "<ul>" + achievements.map((a) => `<li>${a}</li>`).join("") + "</ul>";
}

/*
  Update Smart Suggestions section.
  Provides recommendations based on flashcards and tasks completion percentages.
*/
function updateSmartSuggestions() {
  const flashcards = getAllFlashcards();
  const tasks = getAllTasks();

  const flashcardSubjects = {};
  flashcards.forEach((card) => {
    const sub = card.subject || "Unknown";
    if (!flashcardSubjects[sub]) flashcardSubjects[sub] = { total: 0, completed: 0 };
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
    const sub = task.subject || "Unknown";
    if (!taskSubjects[sub]) taskSubjects[sub] = { total: 0, done: 0 };
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
  Overall function to update the dashboard.
  It sets up the Firebase real-time listener for study insights and updates the other sections.
*/
function updateProgressDashboard() {
  // Update non-Firebase data
  updateTaskBreakdownChart();
  updateMemoryStrengthScores();
  updateAchievements();
  updateSmartSuggestions();

  // For study insights, set a real-time listener if UID is available.
  if (window.currentUserUID) {
    listenToStudyInsights(window.currentUserUID);
  } else {
    // If UID is not available, fall back to default display.
    updateStudyInsightsUI({ streak: 0, weekTime: 0, monthTime: 0 });
  }
}

// Update the dashboard on page load.
document.addEventListener("DOMContentLoaded", updateProgressDashboard);

// (Optional) Export updateProgressDashboard if you want to call it from elsewhere.
export { updateProgressDashboard };
