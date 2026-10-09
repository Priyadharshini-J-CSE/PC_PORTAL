const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { isAllowedRegisterNo } = require('../config/roster');

async function studentLogin(req, res) {
  try {
    const registerNo = String(req.body.registerNo || '').trim().toUpperCase();
    const { password } = req.body;

    if (!registerNo || !password) {
      return res.status(400).json({ error: 'Register number and password are required' });
    }
    if (!isAllowedRegisterNo(registerNo)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = await User.findOne({ registerNo, role: 'student' }).select('+passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.user = { id: user._id, role: 'student', registerNo: user.registerNo };
    res.json({ role: 'student', registerNo: user.registerNo, mustChangePassword: user.mustChangePassword });
  } catch (err) {
    console.error('[auth] studentLogin:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

async function studentChangePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.session.user.id).select('+passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('[auth] changePassword:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

function staffLogin(role) {
  return async (req, res) => {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const { password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await User.findOne({ email, role }).select('+passwordHash');
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });

      req.session.user = { id: user._id, role, email: user.email };
      res.json({ role, email: user.email });
    } catch (err) {
      console.error(`[auth] ${role}Login:`, err.message);
      res.status(500).json({ error: 'Server error' });
    }
  };
}

// PC self-registers only if no PC account exists yet (bootstrap) or via invite
async function pcRegister(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Valid email and password (min 8 chars) required' });
    }

    const existingCount = await User.countDocuments({ role: 'pc' });
    if (existingCount > 0) {
      return res.status(403).json({ error: 'PC registration is closed. Contact the administrator.' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ role: 'pc', email, passwordHash, isActive: true });
    req.session.user = { id: user._id, role: 'pc', email: user.email };
    res.status(201).json({ role: 'pc', email: user.email });
  } catch (err) {
    console.error('[auth] pcRegister:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

// Faculty registers but starts inactive; PC must activate
async function facultyRegister(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Valid email and password (min 8 chars) required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ role: 'faculty', email, passwordHash, isActive: false });
    res.status(201).json({ message: 'Registration submitted. Awaiting PC approval.' });
  } catch (err) {
    console.error('[auth] facultyRegister:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

async function logout(req, res) {
  req.session.destroy((err) => {
    if (err) console.error('[auth] logout:', err.message);
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
}

async function getMe(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Not authenticated' });
  const { role, registerNo, email } = req.session.user;
  const user = await User.findById(req.session.user.id);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ role, registerNo, email, mustChangePassword: user.mustChangePassword });
}

module.exports = {
  studentLogin,
  studentChangePassword,
  pcLogin: staffLogin('pc'),
  facultyLogin: staffLogin('faculty'),
  pcRegister,
  facultyRegister,
  logout,
  getMe,
};
