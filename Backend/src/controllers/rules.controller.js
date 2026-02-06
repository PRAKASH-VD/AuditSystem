const ReconciliationRule = require('../models/ReconciliationRule');

async function listRules(req, res, next) {
  try {
    const rules = await ReconciliationRule.find().sort({ priority: 1 }).lean();
    return res.json(rules);
  } catch (err) {
    return next(err);
  }
}

async function createRule(req, res, next) {
  try {
    const rule = await ReconciliationRule.create(req.body);
    return res.status(201).json(rule);
  } catch (err) {
    return next(err);
  }
}

async function updateRule(req, res, next) {
  try {
    const rule = await ReconciliationRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) {
      return res.status(404).json({ message: 'Not found' });
    }
    return res.json(rule);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listRules, createRule, updateRule };
