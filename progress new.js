// js/progress new.js
"use strict";

function getAllFlashcards() {
  return JSON.parse(localStorage.getItem("flashcards")) || [];
}

function getAllTasks() {
  return JSON.parse(localStorage.getItem("revisionTasks")) || [];
}

function updateProgress() {
  const subjectSelector = document.getElementById("subject-progress");
  const selectedSubject = subjectSelector.value;

  let flashcards = getAllFlashcards();
  let filteredFlashcards = selectedSubject === "all" ?
      flashcards : flashcards.filter(card => card.subject === selectedSubject);

  const flashcardTotal = filteredFlashcards.length;
  const flashcardCompleted = filteredFlashcards.filter(card => card.studied === true).length;
  const flashcardPercent = flashcardTotal ? Math.round((flashcardCompleted / flashcardTotal) * 100) : 0;

  const flashcardFill = document.querySelector("#flashcard-progress .progress-fill");
  const flashcardText = document.getElementById("flashcard-text");
  flashcardFill.style.width = flashcardPercent + "%";
  flashcardText.textContent = `${flashcardCompleted} / ${flashcardTotal} flashcards completed (${flashcardPercent}%)`;

  let tasks = getAllTasks();
  let filteredTasks = selectedSubject === "all" ?
      tasks : tasks.filter(task => task.subject === selectedSubject);

  const taskTotal = filteredTasks.length;
  const taskCompleted = filteredTasks.filter(task => task.done).length;
  const taskPercent = taskTotal ? Math.round((taskCompleted / taskTotal) * 100) : 0;

  const tasksFill = document.querySelector("#tasks-progress .progress-fill");
  const tasksText = document.getElementById("tasks-text");
  tasksFill.style.width = taskPercent + "%";
  tasksText.textContent = `${taskCompleted} / ${taskTotal} tasks completed (${taskPercent}%)`;
}

document.getElementById("subject-progress").addEventListener("change", updateProgress);

updateProgress();
