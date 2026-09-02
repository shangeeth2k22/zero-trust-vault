const express = require('express');
const jwt = require('jsonwebtoken');
const Note = require('../models/Note');

const router = express.Router();

// Middleware to protect this route
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access denied.' });

    try {
        // Remove "Bearer " prefix if it exists and verify
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
        const verified = jwt.verify(cleanToken, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

// POST: Save a new encrypted note
router.post('/', verifyToken, async (req, res) => {
    try {
        const newNote = new Note({
            user: req.user.userId,
            title: req.body.title,
            encryptedContent: req.body.encryptedContent
        });
        const savedNote = await newNote.save();
        res.status(201).json(savedNote);
    } catch (error) {
        console.error(`[Note Error]: ${error.message}`);
        res.status(500).json({ message: 'Failed to save note.' });
    }
});

// GET: Fetch all encrypted notes for the logged-in user
router.get('/', verifyToken, async (req, res) => {
    try {
        console.log("Searching for ID:", req.user.userId);

        // Find notes matching the user's ID and sort by newest first
        const notes = await Note.find({ user: req.user.userId }).sort({ _id: -1 });
        res.status(200).json(notes);
    } catch (error) {
        console.error(`[Fetch Error]: ${error.message}`);
        res.status(500).json({ message: 'Failed to fetch notes.' });
    }
});

// PUT: Update an existing encrypted note
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { title, encryptedContent } = req.body;

        const updatedNote = await Note.findOneAndUpdate(
            { _id: req.params.id, user: req.user.userId },
            { title, encryptedContent },
            { returnDocument: 'after' }
        );

        if (!updatedNote) {
            return res.status(404).json({ message: 'Note not found or unauthorized.' });
        }

        res.status(200).json(updatedNote);
    } catch (error) {
        console.error(`[Update Error]: ${error.message}`);
        res.status(500).json({ message: 'Failed to update note.' });
    }
});

// DELETE: Delete a note permanently
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const deletedNote = await Note.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!deletedNote) {
            return res.status(404).json({ message: 'Note not found or unauthorized.' });
        }

        res.status(200).json({ message: 'Note deleted successfully.' });
    } catch (error) {
        console.error(`[Delete Error]: ${error.message}`);
        res.status(500).json({ message: 'Failed to delete note.' });
    }
});

module.exports = router;