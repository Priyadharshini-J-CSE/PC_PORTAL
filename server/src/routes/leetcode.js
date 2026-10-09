const router = require('express').Router();
const multer = require('multer');
const ctrl = require('../controllers/leetcodeController');
const { requireRole, requireAuth } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', requireRole('pc', 'faculty'), ctrl.listLeetCode);
router.post('/', requireRole('pc'), ctrl.upsertLeetCode);
router.post('/import', requireRole('pc'), upload.single('file'), ctrl.importLeetCode);
router.get('/:registerNo', requireAuth, ctrl.getStudentLeetCode);
router.post('/:registerNo/refresh', requireRole('pc'), ctrl.refreshOne);

module.exports = router;
