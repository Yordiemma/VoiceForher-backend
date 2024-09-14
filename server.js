const express = require('express');
const Database = require('better-sqlite3');
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
const db = new Database(dbPath, { verbose: console.log });

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      age INTEGER,
      location TEXT,
      ethnic_group TEXT,
      type_of_abuse TEXT,
      description TEXT
    )
  `);
  console.log('Table created or verified.');
} catch (err) {
  console.error('Error creating table:', err.message);
}

// POST route to submit a report
app.post('/reports', (req, res) => {
  const { age, location, ethnic_group, type_of_abuse, description } = req.body;
  if (!age || !location || !ethnic_group || !type_of_abuse || !description) {
    return res.status(400).send('All fields (age, location, ethnic_group, type_of_abuse, description) are required.');
  }

  try {
    const query = `INSERT INTO reports (age, location, ethnic_group, type_of_abuse, description) VALUES (?, ?, ?, ?, ?)`;
    const stmt = db.prepare(query);
    const info = stmt.run(age, location, ethnic_group, type_of_abuse, description);
    res.status(201).send({ id: info.lastInsertRowid });
  } catch (err) {
    console.error('Error inserting report:', err.message);
    res.status(500).send('Error submitting the report');
  }
});

// GET route to fetch reports
app.get('/reports', (req, res) => {
  try {
    const query = `SELECT * FROM reports`;
    const stmt = db.prepare(query);
    const reports = stmt.all();
    res.status(200).json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err.message);
    res.status(500).send('Error retrieving reports');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
