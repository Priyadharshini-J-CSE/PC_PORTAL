const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const StudentMaster = require('../models/StudentMaster');
const { ROSTER } = require('../config/roster');

/**
 * POST /api/setup
 * One-time bootstrap: creates the first PC account + all student accounts.
 * Blocked if any PC account already exists.
 */
router.post('/', async (req, res) => {
  try {
    // Block if already set up
    const pcExists = await User.countDocuments({ role: 'pc' });
    if (pcExists > 0) {
      return res.status(403).json({ error: 'Setup already completed. This endpoint is disabled.' });
    }

    const { pcEmail, pcPassword } = req.body;
    const studentPassword = process.env.STUDENT_INITIAL_PASSWORD;

    if (!pcEmail || !pcPassword || pcPassword.length < 8) {
      return res.status(400).json({ error: 'pcEmail and pcPassword (min 8 chars) are required' });
    }
    if (!studentPassword) {
      return res.status(500).json({ error: 'STUDENT_INITIAL_PASSWORD not set in server .env' });
    }

    // Create PC account
    const pcHash = await bcrypt.hash(pcPassword, 12);
    const pcUser = await User.create({
      role: 'pc',
      email: pcEmail.trim().toLowerCase(),
      passwordHash: pcHash,
      isActive: true,
    });

    // Create all student accounts
    const studentHash = await bcrypt.hash(studentPassword, 12);
    let studentsCreated = 0;

    for (const registerNo of ROSTER) {
      const exists = await User.findOne({ registerNo });
      if (exists) continue;
      await User.create({
        role: 'student',
        registerNo,
        passwordHash: studentHash,
        isActive: true,
        mustChangePassword: true,
      });
      await StudentMaster.findOneAndUpdate(
        { registerNo },
        { $setOnInsert: { registerNo, dept: 'CSE', year: 'III' } },
        { upsert: true }
      );
      studentsCreated++;
    }

    // Log in as PC immediately
    req.session.user = { id: pcUser._id, role: 'pc', email: pcUser.email };

    res.status(201).json({
      message: `Setup complete. PC account created. ${studentsCreated} student accounts provisioned.`,
      role: 'pc',
      email: pcUser.email,
      studentsCreated,
    });
  } catch (err) {
    console.error('[setup]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/setup/status — check if setup is needed
router.get('/status', async (req, res) => {
  const pcExists    = await User.countDocuments({ role: 'pc' });
  const adminExists = await User.countDocuments({ role: 'admin' });
  res.json({ setupRequired: pcExists === 0, adminExists: adminExists > 0 });
});

module.exports = router;
