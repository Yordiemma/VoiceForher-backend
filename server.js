const express = require('express');
const sqlite3 = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for your frontend URL
app.use(cors({
  origin: ['https://voice-for-her-frontend.onrender.com', 'http://localhost:3000'] // Frontend URLs allowed
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

// GET route to fetch reports with error handling
app.get('/reports', (req, res) => {
  try {
    const query = `SELECT * FROM reports`;
    const reports = db.prepare(query).all();
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST route to submit a report with error handling
app.post('/reports', (req, res) => {
  const { age, location, ethnic_group, type_of_abuse, description } = req.body;

  // Check if all fields are provided
  if (!age || !location || !ethnic_group || !type_of_abuse || !description) {
    return res.status(400).send('All fields (age, location, ethnic_group, type_of_abuse, description) are required.');
  }

  try {
    const query = `INSERT INTO reports (age, location, ethnic_group, type_of_abuse, description) VALUES (?, ?, ?, ?, ?)`;
    db.prepare(query).run(age, location, ethnic_group, type_of_abuse, description);
    res.status(201).send({ message: 'Report submitted successfully!' });
  } catch (error) {
    console.error('Error submitting report:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
