// js/planner.js
"use strict";

const form = document.getElementById("planner-form");
const taskInput = document.getElementById("task");
const dueDateInput = document.getElementById("due-date");
const taskList = document.getElementById("planner-list");

let tasks = JSON.parse(localStorage.getItem("revisionTasks")) || [];

function getDaysLeft(dueDateString) {
  const today = new Date();
  const dueDate = new Date(dueDateString);
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function displayTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task, index) => {
    const diffDays = getDaysLeft(task.dueDate);
    const daysLeftText = diffDays >= 0 ? `${diffDays} day(s) left` : "Past due";
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <input type="checkbox" ${task.done ? "checked" : ""} onchange="toggleDone(${index})">
        <span class="${task.done ? 'done' : ''}">${task.text}</span>
        <span class="due-date">${daysLeftText}</span>
      </div>
      <button onclick="deleteTask(${index})" class="btn">🗑️</button>
    `;
    taskList.appendChild(li);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  const dueDate = dueDateInput.value;
  if (text && dueDate) {
    tasks.push({ text, done: false, dueDate });
    localStorage.setItem("revisionTasks", JSON.stringify(tasks));
    taskInput.value = "";
    dueDateInput.value = "";
    displayTasks();
  }
});

function toggleDone(index) {
  tasks[index].done = !tasks[index].done;
  localStorage.setItem("revisionTasks", JSON.stringify(tasks));
  displayTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  localStorage.setItem("revisionTasks", JSON.stringify(tasks));
  displayTasks();
}

window.toggleDone = toggleDone;
window.deleteTask = deleteTask;

displayTasks();
