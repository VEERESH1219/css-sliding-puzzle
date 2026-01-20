import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const SCORE_FILE = "./scores.json";

function readScores() {
  try {
    const raw = fs.readFileSync(SCORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return { best: null };
  }
}

function writeScores(data) {
  fs.writeFileSync(SCORE_FILE, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
  res.json({ message: "Puzzle Backend running ✅" });
});

app.get("/best-score", (req, res) => {
  const data = readScores();
  res.json(data);
});

app.post("/save-score", (req, res) => {
  const { moves, time } = req.body;

  if (typeof moves !== "number" || typeof time !== "number") {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const data = readScores();

  // Best score logic: prefer fewer moves, if equal moves then smaller time
  const currentBest = data.best;
  const isBetter =
    !currentBest ||
    moves < currentBest.moves ||
    (moves === currentBest.moves && time < currentBest.time);

  if (isBetter) {
    data.best = { moves, time, updatedAt: new Date().toISOString() };
    writeScores(data);
  }

  res.json({ success: true, best: data.best });
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
