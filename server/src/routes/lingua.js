const router = require('express').Router();
const multer = require('multer');
const ctrl = require('../controllers/linguaController');
const { requireRole, requireAuth } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', requireRole('pc', 'faculty'), ctrl.list);
router.get('/export', requireRole('pc'), ctrl.exportLingua);
router.post('/import', requireRole('pc'), upload.single('file'), ctrl.importLingua);
router.get('/:registerNo', requireAuth, ctrl.getOne);
router.post('/', requireRole('pc'), ctrl.upsert);
router.put('/:registerNo', requireRole('pc'), async (req, res) => {
  req.body.registerNo = req.params.registerNo;
  return ctrl.upsert(req, res);
});

module.exports = router;
