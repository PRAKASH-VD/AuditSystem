const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const requestRoleSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  requestedRole: Joi.string().valid('admin', 'analyst', 'viewer').required(),
  message: Joi.string().max(500).allow('', null)
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(8).required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(6).required(),
  newPassword: Joi.string().min(8).required()
});

module.exports = { loginSchema, requestRoleSchema, resetPasswordSchema, changePasswordSchema };
