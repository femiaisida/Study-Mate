// js/quiz.js
"use strict";

// Import getFlashcards from flashcards.js
import { getFlashcards } from "./flashcards.js";

// Get DOM elements
const questionText        = document.getElementById("question-text");
const answerButtons       = document.getElementById("answer-buttons");
const nextBtn             = document.getElementById("next-btn");
const skipBtn             = document.getElementById("skip-btn");
const scoreText           = document.getElementById("score-text");
const timerText           = document.getElementById("timer-text");
const questionTimerSelect = document.getElementById("question-timer");
const subjectSelect       = document.getElementById("subject-select");
const numQuestionsSelect  = document.getElementById("num-questions");
const startBtn            = document.getElementById("start-btn");

// Variables to track quiz state
let filteredFlashcards = [];
let shuffledFlashcards = [];
let currentQuestionIndex = 0;
let score = 0;
let timerInterval;

// Instead of storing currentUserUID locally,
// we always read it from window.currentUserUID (set by auth.js)
async function getAllFlashcards() {
  const uid = window.currentUserUID;
  if (!uid) {
    console.error("User not authenticated");
    return [];
  }
  return await getFlashcards(uid);
}

// Filter flashcards by subject (normalize to lowercase)
async function getFilteredFlashcards() {
  const allFlashcards = await getAllFlashcards();
  const selectedSubject = subjectSelect.value;
  return selectedSubject === "all"
    ? allFlashcards
    : allFlashcards.filter(card => card.subject.toLowerCase() === selectedSubject.toLowerCase());
}

// Start the quiz using flashcards from Firestore
async function startQuiz() {
  filteredFlashcards = await getFilteredFlashcards();

  if (filteredFlashcards.length === 0) {
    questionText.style.display = "";
    questionText.textContent = "No flashcards available for quiz. Please add some flashcards first!";
    return;
  }
  
  const numQuestions = parseInt(numQuestionsSelect.value, 10);
  shuffledFlashcards = [...filteredFlashcards]
    .sort(() => Math.random() - 0.5)
    .slice(0, numQuestions);
  
  currentQuestionIndex = 0;
  score = 0;
  
  // Hide the start button and show quiz-related elements
  startBtn.style.display = "none";
  timerText.style.display = "";
  questionText.style.display = "";
  answerButtons.style.display = "";
  scoreText.style.display = "";
  nextBtn.style.display = "none";
  skipBtn.style.display = "inline-block";
  
  showQuestion();
}

function showQuestion() {
  answerButtons.innerHTML = "";
  nextBtn.style.display = "none";
  clearInterval(timerInterval);

  // Check if quiz is complete
  if (currentQuestionIndex >= shuffledFlashcards.length || shuffledFlashcards.length === 0) {
    questionText.textContent = "Quiz Complete!";
    scoreText.textContent = `Your Score: ${score} / ${shuffledFlashcards.length}`;
    timerText.textContent = "";
    skipBtn.style.display = "none";
    
    // Create a Restart Quiz button
    const restartBtn = document.createElement("button");
    restartBtn.textContent = "Restart Quiz";
    restartBtn.className = "btn";
    restartBtn.onclick = () => {
      window.location.reload(); // Refresh the page to restart the quiz
    };
    
    // Clear any previous buttons and show restart button
    answerButtons.innerHTML = "";
    answerButtons.appendChild(restartBtn);
    return;
  }
  
  const currentCard = shuffledFlashcards[currentQuestionIndex];
  questionText.textContent = `Q${currentQuestionIndex + 1}: ${currentCard.question}`;
  
  // Build answer options (correct answer + random incorrect answers)
  let options = [currentCard.answer];
  // Use all flashcards to choose additional answers
  getAllFlashcards().then(allFlashcards => {
    while (options.length < 4 && allFlashcards.length > 1) {
      const randomCard = allFlashcards[Math.floor(Math.random() * allFlashcards.length)];
      if (!options.includes(randomCard.answer)) {
        options.push(randomCard.answer);
      }
    }
    // Shuffle the answer options
    options.sort(() => Math.random() - 0.5);
  
    options.forEach(option => {
      const btn = document.createElement("button");
      btn.textContent = option;
      btn.className = "btn";
      btn.onclick = () => {
        clearInterval(timerInterval);
        if (option === currentCard.answer) {
          score++;
          btn.style.backgroundColor = "#28a745"; // Green for correct
        } else {
          btn.style.backgroundColor = "#dc3545"; // Red for incorrect
        }
        Array.from(answerButtons.children).forEach(button => button.disabled = true);
        nextBtn.style.display = "inline-block";
      };
      answerButtons.appendChild(btn);
    });
  });
  
  // Set up the timer for the question
  const timePerQuestion = parseInt(questionTimerSelect.value, 10) || 15;
  let timeLeft = timePerQuestion;
  timerText.textContent = `Time left: ${timeLeft} seconds`;
  
  timerInterval = setInterval(() => {
    timeLeft--;
    timerText.textContent = `Time left: ${timeLeft} seconds`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      Array.from(answerButtons.children).forEach(button => button.disabled = true);
      nextBtn.style.display = "inline-block";
      timerText.textContent = "Time's up!";
    }
  }, 1000);
}

// Event Listeners
nextBtn.addEventListener("click", () => {
  currentQuestionIndex++;
  showQuestion();
});

skipBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  Array.from(answerButtons.children).forEach(button => button.disabled = true);
  currentQuestionIndex++;
  showQuestion();
});

subjectSelect.addEventListener("change", startQuiz);
startBtn.addEventListener("click", startQuiz);
