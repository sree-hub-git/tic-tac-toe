const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const db = new sqlite3.Database(':memory:'); // Use a file like './leaderboard.db' for persistence

app.use(express.json());
app.use(express.static('.')); // Serve static files from the current directory

// Initialize the database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL
  )`);
});

// Route to save a score
app.post('/score', (req, res) => {
  const { player_name, score } = req.body;
  if (!player_name || score == null) {
    return res.status(400).json({ error: 'Missing data' });
  }
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
