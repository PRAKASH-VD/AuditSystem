const Joi = require('joi');

const mappingSchema = Joi.object({
  transactionId: Joi.string().required(),
  amount: Joi.string().required(),
  referenceNumber: Joi.string().required(),
  date: Joi.string().required()
});

const uploadSchema = Joi.object({
  mapping: Joi.alternatives().try(mappingSchema, Joi.string()).optional()
});

module.exports = { uploadSchema, mappingSchema };
