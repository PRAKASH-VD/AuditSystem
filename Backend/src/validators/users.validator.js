const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'analyst', 'viewer').required()
});

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'analyst', 'viewer').required()
});

module.exports = { createUserSchema, updateRoleSchema };
