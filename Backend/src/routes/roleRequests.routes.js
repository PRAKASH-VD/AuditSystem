const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { listRoleRequests, updateRoleRequest } = require('../controllers/roleRequest.controller');

router.get('/', requireAuth, requireRole(['admin']), listRoleRequests);
router.patch('/:id', requireAuth, requireRole(['admin']), updateRoleRequest);

module.exports = router;
