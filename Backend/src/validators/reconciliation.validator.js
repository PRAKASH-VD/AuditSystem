const Joi = require('joi');

const manualReconcileSchema = Joi.object({
  uploadedRecord: Joi.object({
    transactionId: Joi.string().optional(),
    amount: Joi.number().optional(),
    referenceNumber: Joi.string().optional(),
    date: Joi.date().optional()
  }).optional(),
  status: Joi.string().valid('exact', 'partial', 'duplicate', 'unmatched').optional(),
  notes: Joi.string().max(500).optional()
});

module.exports = { manualReconcileSchema };
