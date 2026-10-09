const router = require('express').Router();
const multer = require('multer');
const ctrl = require('../controllers/studentsController');
const { requireAuth, requireRole } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// PC/Faculty can list and view
router.get('/', requireRole('pc', 'faculty'), ctrl.listStudents);
router.get('/export', requireRole('pc'), ctrl.exportStudents);
router.post('/import', requireRole('pc'), upload.single('file'), ctrl.importStudents);
router.get('/:registerNo', requireRole('pc', 'faculty'), ctrl.getStudent);
router.put('/:registerNo', requireRole('pc'), ctrl.updateStudent);

module.exports = router;
