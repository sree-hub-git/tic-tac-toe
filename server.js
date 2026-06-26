const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const db = new sqlite3.Database(path.resolve(__dirname, 'database.sqlite'));

app.use(express.json());

// Serve static files (HTML, CSS, JS, etc.) from the project root
app.use(express.static(path.resolve(__dirname)));

// Initialize the database with a leaderboard table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      score INTEGER NOT NULL
    )
  `);
});

/**
 * Route to save a player's score.
 * Expects a JSON body: { "player_name": "Name" }
 * Returns: { "id": <inserted_row_id> }
 */
app.post('/score', (req, res) => {
  const { player_name } = req.body;

  if (!player_name || typeof player_name !== 'string' || player_name.trim() === '') {
    return res.status(400).json({ error: 'Invalid or missing player_name' });
  }

  const trimmedName = player_name.trim().substring(0, 15); // enforce max length like the UI
  const score = 1; // Current implementation always records a win as 1 point

  const stmt = db.prepare('INSERT INTO leaderboard (player_name, score) VALUES (?, ?)');
  stmt.run(trimmedName, score, function (err) {
    if (err) {
      console.error('Database insert error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ id: this.lastID });
  });
  stmt.finalize();
});

/**
 * Route to fetch all scores, ordered by highest score first.
 * Returns: [{ id, player_name, score }, ...]
 */
app.get('/scores', (req, res) => {
  db.all('SELECT * FROM leaderboard ORDER BY score DESC, id ASC', (err, rows) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

/**
 * Fallback route: serve index.html for any unknown paths (useful for SPA navigation).
 */
app.get('/:wildcard*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
