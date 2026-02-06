const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { listUsers, createUser, updateUserRole } = require('../controllers/users.controller');
const { createUserSchema, updateRoleSchema } = require('../validators/users.validator');

router.get('/', requireAuth, requireRole(['admin']), listUsers);
router.post('/', requireAuth, requireRole(['admin']), validate(createUserSchema), createUser);
router.patch('/:id/role', requireAuth, requireRole(['admin']), validate(updateRoleSchema), updateUserRole);

module.exports = router;
