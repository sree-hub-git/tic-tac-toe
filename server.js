const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const db = new sqlite3.Database('./database.sqlite');

app.use(express.json());
app.use(express.static('.'));

// Initialize the database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL
  )`);
});

// Machine's move logic
function machineMove() {
  // Check for immediate win or block
  const winningConditions = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diags
  ];

  // Check for win
  for (let i = 0; i < winningConditions.length; i++) {
    const [a,b,c] = winningConditions[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] === 'X' ? 'O' : 'X';
    }
  }

  // Check for block (prevent human from clicking)
  if (board[0] === 'X' || board[1] === 'X' || board[2] === 'X') {
    return board[3]; // Block human from clicking
  }

  // Fallback to random move (for demo)
  const randomIndex = Math.floor(Math.random() * 9);
  return board[randomIndex];
}

// Route to save a score
app.post('/score', (req, res) => {
  const { player_name } = req.body;
  if (!player_name) {
    return res.status(400).json({ error: 'Missing player name' });
  }
  const score = 1;
  const stmt = db.prepare('INSERT INTO leaderboard (player_name, score) VALUES (?, ?)');
  stmt.run(player_name, score, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ id: this.lastID });
  });
  stmt.finalize();
});

// Route to fetch all scores
app.get('/scores', (req, res) => {
  db.all('SELECT * FROM leaderboard ORDER BY score DESC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
