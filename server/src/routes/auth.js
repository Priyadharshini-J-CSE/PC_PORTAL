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
router.post('/logout', ctrl.logout);
router.get('/me', ctrl.getMe);

// PC approves faculty accounts
router.patch('/faculty/:id/approve', requireRole('pc'), async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'faculty' },
      { isActive: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'Faculty account not found' });
    res.json({ message: 'Faculty account approved', email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PC lists pending faculty
router.get('/faculty/pending', requireRole('pc'), async (req, res) => {
  try {
    const User = require('../models/User');
    const pending = await User.find({ role: 'faculty', isActive: false }).select('-passwordHash');
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
