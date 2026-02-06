const router = require('express').Router();
const multer = require('multer');
const { env } = require('../config/env');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { uploadSchema } = require('../validators/upload.validator');
const { createUploadJob, getUploadJob, listUploadJobs, previewUpload, submitUploadJob, getPreview } = require('../controllers/upload.controller');

const upload = multer({ dest: env.UPLOAD_DIR });

router.get('/', requireAuth, requireRole(['admin', 'analyst', 'viewer']), listUploadJobs);
router.post('/preview', requireAuth, requireRole(['admin', 'analyst']), upload.single('file'), previewUpload);
router.get('/:id/preview', requireAuth, requireRole(['admin', 'analyst']), getPreview);
router.post('/', requireAuth, requireRole(['admin', 'analyst']), upload.single('file'), validate(uploadSchema), createUploadJob);
router.post('/:id/submit', requireAuth, requireRole(['admin', 'analyst']), validate(uploadSchema), submitUploadJob);
router.get('/:id', requireAuth, getUploadJob);

module.exports = router;
