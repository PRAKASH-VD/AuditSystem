const router = require('express').Router();
const { validate } = require('../middleware/validate');
const { loginSchema, requestRoleSchema } = require('../validators/auth.validator');
const { login, logout, me, requestRole, resetPassword, changePassword } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { resetPasswordSchema, changePasswordSchema } = require('../validators/auth.validator');

router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.post('/request-role', validate(requestRoleSchema), requestRole);
router.post('/reset-password', requireAuth, validate(resetPasswordSchema), resetPassword);
router.post('/change-password', requireAuth, validate(changePasswordSchema), changePassword);

module.exports = router;
