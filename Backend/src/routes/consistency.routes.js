const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { getConsistencyReport } = require('../controllers/consistency.controller');

router.get('/uploads/:id/consistency', requireAuth, requireRole(['admin', 'analyst']), getConsistencyReport);

module.exports = router;
