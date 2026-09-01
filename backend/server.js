require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth'); // Import auth routes

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to the database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes); // Connect auth routes to the app

const notesRoute = require('./routes/notes');
app.use('/api/notes', notesRoute);

// Baseline Test Route
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'secure',
        message: 'Zero-Trust Vault API is active and listening.'
    });
});

// Server Initialization
app.listen(PORT, () => {
    console.log(`[Server] Active on port ${PORT}`);
});