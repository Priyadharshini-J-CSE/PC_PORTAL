const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/authController');
const { requireAuth, requireRole } = require('../middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/student/login', loginLimiter, ctrl.studentLogin);
router.post('/student/change-password', requireAuth, ctrl.studentChangePassword);
router.post('/pc/login', loginLimiter, ctrl.pcLogin);
router.post('/pc/register', ctrl.pcRegister);
router.post('/faculty/login', loginLimiter, ctrl.facultyLogin);
router.post('/faculty/register', ctrl.facultyRegister);
router.post('/admin/login', loginLimiter, ctrl.adminLogin);
router.post('/admin/register', ctrl.adminRegister);
router.post('/logout', ctrl.logout);
router.get('/me', ctrl.getMe);

// Admin: list all staff accounts (faculty + pc)
router.get('/staff', requireRole('admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const staff = await User.find({ role: { $in: ['faculty', 'pc'] } }).select('-passwordHash').sort({ role: 1, createdAt: 1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: approve (activate) a staff account
router.patch('/staff/:id/approve', requireRole('admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $in: ['faculty', 'pc'] } },
      { isActive: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account approved', email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: deactivate a staff account
router.patch('/staff/:id/deactivate', requireRole('admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $in: ['faculty', 'pc'] } },
      { isActive: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account deactivated', email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
