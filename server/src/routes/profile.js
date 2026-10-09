const router = require('express').Router();
const ctrl = require('../controllers/studentsController');
const { requireRole } = require('../middleware/auth');

router.get('/me', requireRole('student'), ctrl.getMyProfile);
router.put('/me', requireRole('student'), ctrl.updateMyProfile);

module.exports = router;
