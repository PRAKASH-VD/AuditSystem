const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/uploads', require('./upload.routes'));
router.use('/reconciliation', require('./reconciliation.routes'));
router.use('/audit', require('./audit.routes'));
router.use('/users', require('./users.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/role-requests', require('./roleRequests.routes'));
router.use('/consistency', require('./consistency.routes'));

module.exports = router;
