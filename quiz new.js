// js/quiz new.js
"use strict";

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

// For this quiz, we still use localStorage flashcards. 
// (You could update to Firestore in a similar manner if needed.)
let filteredFlashcards = [];
let shuffledFlashcards = [];
let currentQuestionIndex = 0;
let score = 0;
let timerInterval;

function getAllFlashcards() {
  return JSON.parse(localStorage.getItem("flashcards")) || [];
}

function getFilteredFlashcards() {
  const allFlashcards = getAllFlashcards();
  const selectedSubject = subjectSelect.value;
  return selectedSubject === "all" ? allFlashcards : allFlashcards.filter(card => card.subject === selectedSubject);
}

function startQuiz() {
  filteredFlashcards = getFilteredFlashcards();
  const numQuestions = parseInt(numQuestionsSelect.value, 10);
  shuffledFlashcards = [...filteredFlashcards].sort(() => Math.random() - 0.5).slice(0, numQuestions);
  
  currentQuestionIndex = 0;
  score = 0;
  
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

  if (currentQuestionIndex >= shuffledFlashcards.length || shuffledFlashcards.length === 0) {
    questionText.textContent = "Quiz Complete!";
    scoreText.textContent = `Your Score: ${score} / ${shuffledFlashcards.length}`;
    timerText.textContent = "";
    skipBtn.style.display = "none";
    return;
  }
  
  const currentCard = shuffledFlashcards[currentQuestionIndex];
  questionText.textContent = `Q${currentQuestionIndex + 1}: ${currentCard.question}`;

  let options = [currentCard.answer];
  const allFlashcards = getAllFlashcards();
  while (options.length < 4 && allFlashcards.length > 1) {
    const randomCard = allFlashcards[Math.floor(Math.random() * allFlashcards.length)];
    if (!options.includes(randomCard.answer)) {
      options.push(randomCard.answer);
    }
  }
  options.sort(() => Math.random() - 0.5);

  options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className = "btn";
    btn.onclick = () => {
      clearInterval(timerInterval);
      if (option === currentCard.answer) {
        score++;
        btn.style.backgroundColor = "#28a745";
      } else {
        btn.style.backgroundColor = "#dc3545";
      }
      Array.from(answerButtons.children).forEach(button => button.disabled = true);
      nextBtn.style.display = "inline-block";
    };
    answerButtons.appendChild(btn);
  });

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
