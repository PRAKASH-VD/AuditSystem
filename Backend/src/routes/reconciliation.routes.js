const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { listResults, getResult, manualUpdate } = require('../controllers/reconciliation.controller');
const { listRules, createRule, updateRule, updatePartialTolerance } = require('../controllers/rules.controller');
const { ruleSchema, ruleUpdateSchema, toleranceUpdateSchema } = require('../validators/rules.validator');
const { manualReconcileSchema } = require('../validators/reconciliation.validator');

router.get('/rules/list', requireAuth, requireRole(['admin']), listRules);
router.post('/rules', requireAuth, requireRole(['admin']), validate(ruleSchema), createRule);
router.patch('/rules/partial-tolerance', requireAuth, requireRole(['admin']), validate(toleranceUpdateSchema), updatePartialTolerance);
router.patch('/rules/:id', requireAuth, requireRole(['admin']), validate(ruleUpdateSchema), updateRule);
router.get('/', requireAuth, requireRole(['admin', 'analyst', 'viewer']), listResults);
router.get('/:id', requireAuth, requireRole(['admin', 'analyst', 'viewer']), getResult);
router.patch('/:id/manual', requireAuth, requireRole(['admin', 'analyst']), validate(manualReconcileSchema), manualUpdate);

module.exports = router;
