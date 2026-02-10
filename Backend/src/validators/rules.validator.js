const Joi = require('joi');

const ruleSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('exact', 'partial', 'duplicate', 'unmatched').required(),
  config: Joi.object().optional(),
  priority: Joi.number().integer().min(1).optional(),
  active: Joi.boolean().optional()
});

const ruleUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  type: Joi.string().valid('exact', 'partial', 'duplicate', 'unmatched').optional(),
  config: Joi.object().optional(),
  priority: Joi.number().integer().min(1).optional(),
  active: Joi.boolean().optional()
});

const toleranceUpdateSchema = Joi.object({
  amountVariancePercent: Joi.number().min(0).max(1).required()
});

module.exports = { ruleSchema, ruleUpdateSchema, toleranceUpdateSchema };
