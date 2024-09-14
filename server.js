const express = require('express');
const sqlite3 = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for your frontend URL
app.use(cors({
  origin: 'https://voice-for-her-frontend.onrender.com'  // Update with your frontend URL
}));

app.use(express.json());

// SQLite Database Setup
const dbPath = path.resolve(__dirname, './abuse_reports.db');
const db = new sqlite3(dbPath);

// Create the table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    age INTEGER,
    location TEXT,
    ethnic_group TEXT,
    type_of_abuse TEXT,
    description TEXT
  )
`).run();

// Default route for the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the VoiceForHer Backend!');
});

// POST route to submit a report
app.post('/reports', (req, res) => {
  const { age, location, ethnic_group, type_of_abuse, description } = req.body;
  if (!age || !location || !ethnic_group || !type_of_abuse || !description) {
    return res.status(400).send('All fields (age, location, ethnic_group, type_of_abuse, description) are required.');
  }

  const query = `INSERT INTO reports (age, location, ethnic_group, type_of_abuse, description) VALUES (?, ?, ?, ?, ?)`;
  db.prepare(query).run(age, location, ethnic_group, type_of_abuse, description);
  res.status(201).send({ message: 'Report submitted successfully!' });
});

// GET route to fetch reports
app.get('/reports', (req, res) => {
  const query = `SELECT * FROM reports`;
  const reports = db.prepare(query).all();
  res.status(200).json(reports);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
