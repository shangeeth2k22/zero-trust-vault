const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

// User Registration Route
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists in the vault.' });
    }

    // Create and save the new user (User.js will automatically hash the password!)
    const newUser = new User({ email, password });
    await newUser.save();

    res.status(201).json({ message: 'Secure account created successfully.' });
  } catch (error) {
    console.error(`[Auth Error]: ${error.message}`);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// User Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // 2. Compare the entered password with the encrypted database password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // 3. Generate the secure token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour for security
    );

    res.status(200).json({
      message: 'Login successful.',
      token
    });
  } catch (error) {
    console.error(`[Auth Error]: ${error.message}`);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;