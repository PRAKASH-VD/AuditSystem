const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { listAuditLogs, getTimeline, exportAuditCsv } = require('../controllers/audit.controller');

router.get('/', requireAuth, requireRole(['admin', 'analyst', 'viewer']), listAuditLogs);
router.get('/timeline/:recordType/:recordId', requireAuth, requireRole(['admin', 'analyst', 'viewer']), getTimeline);
router.get('/export', requireAuth, requireRole(['admin', 'analyst']), exportAuditCsv);

module.exports = router;
