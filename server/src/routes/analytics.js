const router = require('express').Router();
const ctrl = require('../controllers/analyticsController');
const { requireRole } = require('../middleware/auth');

router.get('/pc', requireRole('pc'), ctrl.pcAnalytics);
router.get('/faculty', requireRole('pc', 'faculty'), ctrl.facultyAnalytics);
router.get('/student', requireRole('student'), ctrl.studentAnalytics);

module.exports = router;
