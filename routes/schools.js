const express = require('express');
const multer = require('multer');
const { query } = require('../config/db');

const router = express.Router();

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Get all schools
router.get('/', async (req, res) => {
  try {
    const schools = await query('SELECT * FROM schools ORDER BY id DESC', []);
    res.json({ data: schools });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add school
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, address, city, state, contact, email_id } = req.body;

    // Validation
    if (!name || !address || !city || !state || !contact || !email_id) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_id)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contact)) {
      return res.status(400).json({ error: 'Contact must be 10 digits' });
    }

    let imageData = null;
    if (req.file) {
      imageData = req.file.buffer.toString('base64');
    }

    const result = await query(
      'INSERT INTO schools (name, address, city, state, contact, email_id, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, address, city, state, contact, email_id, imageData]
    );

    res.status(201).json({ message: 'School added successfully', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete school
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM schools WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
