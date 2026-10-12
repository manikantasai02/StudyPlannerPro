const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Users } = require('../db');
const { protect } = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    if (Users.findByEmail(email))
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const user = Users.create({ name: name.trim(), email, password: hash });

    res.status(201).json({ success: true, token: signToken(user.id), user: Users.safe(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = Users.findByEmail(email);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    res.json({ success: true, token: signToken(user.id), user: Users.safe(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: Users.safe(req.user) });
});

// PUT /api/auth/profile
router.put('/profile', protect, (req, res) => {
  const { name, weeklyGoal, alertEmail, alertDeadline, alertWeekly } = req.body;
  const updates = {};
  if (name) updates.name = name.trim();
  if (weeklyGoal !== undefined) updates.weeklyGoal = Number(weeklyGoal);
  if (alertEmail !== undefined) updates.alertEmail = alertEmail;
  if (alertDeadline !== undefined) updates.alertDeadline = alertDeadline;
  if (alertWeekly !== undefined) updates.alertWeekly = alertWeekly;

  const updated = Users.update(req.user.id, updates);
  res.json({ success: true, user: Users.safe(updated) });
});

module.exports = router;
