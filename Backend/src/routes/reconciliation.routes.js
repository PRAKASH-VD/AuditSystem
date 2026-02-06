const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { listResults, getResult, manualUpdate } = require('../controllers/reconciliation.controller');
const { listRules, createRule, updateRule } = require('../controllers/rules.controller');
const { ruleSchema, ruleUpdateSchema } = require('../validators/rules.validator');
const { manualReconcileSchema } = require('../validators/reconciliation.validator');

router.get('/rules/list', requireAuth, requireRole(['admin']), listRules);
router.post('/rules', requireAuth, requireRole(['admin']), validate(ruleSchema), createRule);
router.patch('/rules/:id', requireAuth, requireRole(['admin']), validate(ruleUpdateSchema), updateRule);
router.get('/', requireAuth, requireRole(['admin', 'analyst', 'viewer']), listResults);
router.get('/:id', requireAuth, requireRole(['admin', 'analyst', 'viewer']), getResult);
router.patch('/:id/manual', requireAuth, requireRole(['admin', 'analyst']), validate(manualReconcileSchema), manualUpdate);

module.exports = router;
