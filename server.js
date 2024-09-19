require('dotenv').config();  // Load environment variables

const express = require('express');
const { Pool } = require('pg');  // PostgreSQL client
const cors = require('cors');
const app = express();

// Get PORT and DATABASE_URL from environment variables
const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable not found!');
  process.exit(1);  // Exit if no database URL is found
}

// PostgreSQL connection setup
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Create a table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    age INTEGER,
    location TEXT,
    ethnic_group TEXT,
    type_of_abuse TEXT,
    description TEXT
  );
`, (err, res) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('Table is ready or already exists.');
  }
});

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://voiceforher-frontend.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// Route to submit a report
app.post('/reports', async (req, res) => {
  const { age, location, ethnic_group, type_of_abuse, description } = req.body;

  if (!age || !location || !ethnic_group || !type_of_abuse || !description) {
    return res.status(400).send('All fields are required.');
  }

  const query = `
    INSERT INTO reports (age, location, ethnic_group, type_of_abuse, description)
    VALUES ($1, $2, $3, $4, $5) RETURNING id
  `;

  try {
    const result = await pool.query(query, [age, location, ethnic_group, type_of_abuse, description]);
    res.status(201).send({ id: result.rows[0].id });
  } catch (err) {
    console.error('Error inserting report:', err.message);
    res.status(500).send('Error submitting the report');
  }
});

// Route to fetch all reports
app.get('/reports', async (req, res) => {
  const query = `SELECT * FROM reports`;

  try {
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching reports:', err.message);
    res.status(500).send('Error retrieving reports');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
