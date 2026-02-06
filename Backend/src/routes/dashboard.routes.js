const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { getSummary } = require('../controllers/dashboard.controller');

router.get('/summary', requireAuth, requireRole(['admin', 'analyst', 'viewer']), getSummary);

module.exports = router;
