const express = require('express');
const sqlite3 = require('sqlite3').verbose();
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
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        age INTEGER,
        location TEXT,
        ethnic_group TEXT,
        type_of_abuse TEXT,
        description TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Table created or verified.');
      }
    });
  }
});

// POST route to submit a report
app.post('/reports', (req, res) => {
  const { age, location, ethnic_group, type_of_abuse, description } = req.body;
  if (!age || !location || !ethnic_group || !type_of_abuse || !description) {
    return res.status(400).send('All fields (age, location, ethnic_group, type_of_abuse, description) are required.');
  }
  
  const query = `INSERT INTO reports (age, location, ethnic_group, type_of_abuse, description) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [age, location, ethnic_group, type_of_abuse, description], function (err) {
    if (err) {
      console.error('Error inserting report:', err.message);
      res.status(500).send('Error submitting the report');
    } else {
      res.status(201).send({ id: this.lastID });
    }
  });
});

// GET route to fetch reports
app.get('/reports', (req, res) => {
  const query = `SELECT * FROM reports`;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching reports:', err.message);
      res.status(500).send('Error retrieving reports');
    } else {
      res.status(200).json(rows);
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
