const router = require('express').Router();
const ctrl = require('../controllers/interviewController');
const { requireRole, requireAuth } = require('../middleware/auth');

router.get('/', requireRole('pc', 'faculty'), ctrl.listAll);
router.get('/mine', requireRole('student'), ctrl.getMine);
router.get('/:id', requireAuth, ctrl.getOne);
router.post('/', requireRole('student'), ctrl.create);
router.delete('/:id', requireRole('student'), ctrl.deleteOne);

module.exports = router;
