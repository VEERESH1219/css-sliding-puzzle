const puzzleEl = document.getElementById("puzzle");
const movesEl = document.getElementById("moves");
const timeEl = document.getElementById("time");
const messageEl = document.getElementById("message");
const bestScoreEl = document.getElementById("bestScore");

const shuffleBtn = document.getElementById("shuffleBtn");
const resetBtn = document.getElementById("resetBtn");

const size = 3;
let tiles = []; // 0 is blank
let moves = 0;
let seconds = 0;
let timer = null;
let started = false;

const API_BASE = "http://localhost:3000";

function initSolvedBoard() {
  tiles = [];
  for (let i = 1; i <= size * size - 1; i++) tiles.push(i);
  tiles.push(0);
}

function render() {
  puzzleEl.innerHTML = "";
  tiles.forEach((num, idx) => {
    const tile = document.createElement("div");
    tile.classList.add("tile");

    if (num === 0) {
      tile.classList.add("blank");
      tile.textContent = "";
    } else {
      tile.textContent = num;
      tile.addEventListener("click", () => handleMove(idx));
    }

    puzzleEl.appendChild(tile);
  });

  movesEl.textContent = moves;
  timeEl.textContent = seconds;
}

function startTimer() {
  if (timer) return;
  timer = setInterval(() => {
    seconds++;
    timeEl.textContent = seconds;
  }, 1000);
}

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

function indexToRowCol(i) {
  return { r: Math.floor(i / size), c: i % size };
}

function isAdjacent(i1, i2) {
  const a = indexToRowCol(i1);
  const b = indexToRowCol(i2);
  const dr = Math.abs(a.r - b.r);
  const dc = Math.abs(a.c - b.c);
  return (dr + dc) === 1;
}

function handleMove(tileIndex) {
  const blankIndex = tiles.indexOf(0);
  if (!isAdjacent(tileIndex, blankIndex)) return;

  if (!started) {
    started = true;
    startTimer();
    messageEl.textContent = "";
  }

  // swap tile with blank
  [tiles[tileIndex], tiles[blankIndex]] = [tiles[blankIndex], tiles[tileIndex]];
  moves++;
  render();

  if (isSolved()) {
    stopTimer();
    messageEl.textContent = `✅ Puzzle solved! Moves: ${moves}, Time: ${seconds}s`;
    saveScore();
  }
}

function isSolved() {
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[tiles.length - 1] === 0;
}

// Fisher-Yates shuffle
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function shufflePuzzle() {
  initSolvedBoard();
  shuffleArray(tiles);

  // Keep shuffling until solvable and not already solved
  while (!isSolvable(tiles) || isSolved()) {
    shuffleArray(tiles);
  }

  moves = 0;
  seconds = 0;
  started = false;
  stopTimer();
  messageEl.textContent = "🔀 Shuffled! Start solving...";
  render();
}

// For 3x3 solvable if inversion count is even
function isSolvable(arr) {
  const nums = arr.filter(n => n !== 0);
  let inv = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] > nums[j]) inv++;
    }
  }
  return inv % 2 === 0;
}

function resetPuzzle() {
  initSolvedBoard();
  moves = 0;
  seconds = 0;
  started = false;
  stopTimer();
  messageEl.textContent = "♻️ Reset done!";
  render();
}

async function loadBestScore() {
  try {
    const res = await fetch(`${API_BASE}/best-score`);
    const data = await res.json();
    if (!data || !data.best) {
      bestScoreEl.textContent = "No best score yet.";
      return;
    }
    bestScoreEl.textContent = `Moves: ${data.best.moves}, Time: ${data.best.time}s`;
  } catch (e) {
    bestScoreEl.textContent = "Backend not running ❌";
  }
}

async function saveScore() {
  try {
    const payload = { moves, time: seconds };
    await fetch(`${API_BASE}/save-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    loadBestScore();
  } catch (e) {
    // ignore
  }
}

shuffleBtn.addEventListener("click", shufflePuzzle);
resetBtn.addEventListener("click", resetPuzzle);

// init
initSolvedBoard();
render();
loadBestScore();
