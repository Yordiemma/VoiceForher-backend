require('dotenv').config();  // Load environment variables
const express = require('express');
const { Pool } = require('pg');  // PostgreSQL client
const cors = require('cors'); // Import CORS
const jwt = require('jsonwebtoken'); // Import JWT
const app = express();
const path = require('path'); 
const rateLimit = require('express-rate-limit'); // Import rate limiting

// Get PORT and DATABASE_URL from environment variables
const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable not found!');
  process.exit(1);  // Exit if no database URL is found
}

// CORS configuration (ADD HERE)
const allowedOrigins = [
  'http://localhost:3000', // For local testing
  'https://voice-for-her-frontend.onrender.com' //  frontend in production
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

// PostgreSQL connection setup
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false // SSL in production, not locally
});

// Middleware for JSON body parsing (important for POST requests)
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});
app.use(limiter);

// JWT Middleware
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};

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

// Routes
// Unprotected route to submit a report
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

// Protected route to fetch all reports (requires JWT token)
app.get('/reports', authenticateJWT, async (req, res) => {
  const query = `SELECT id, age, location, ethnic_group, type_of_abuse FROM reports`;  // Limit fields returned

  try {
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching reports:', err.message);
    res.status(500).send('Error retrieving reports');
  }
});

// Serve static files from the React app build
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all handler to serve React's index.html for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
