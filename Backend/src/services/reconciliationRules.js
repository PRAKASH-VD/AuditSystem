const ReconciliationRule = require('../models/ReconciliationRule');

const defaultRules = [
  {
    name: 'Duplicate Transaction ID',
    type: 'duplicate',
    priority: 1,
    active: true,
    config: {}
  },
  {
    name: 'Exact Match (Transaction ID + Amount)',
    type: 'exact',
    priority: 2,
    active: true,
    config: {
      matchFields: ['transactionId', 'amount']
    }
  },
  {
    name: 'Partial Match (Reference Number, Amount ?2%)',
    type: 'partial',
    priority: 3,
    active: true,
    config: {
      matchField: 'referenceNumber',
      amountVariancePercent: 0.02
    }
  },
  {
    name: 'Unmatched Fallback',
    type: 'unmatched',
    priority: 99,
    active: true,
    config: {}
  }
];

async function ensureDefaultRules() {
  const count = await ReconciliationRule.countDocuments();
  if (count === 0) {
    await ReconciliationRule.insertMany(defaultRules);
  }
}

async function getActiveRules() {
  return ReconciliationRule.find({ active: true }).sort({ priority: 1 }).lean();
}

module.exports = { ensureDefaultRules, getActiveRules };
