const mongoose = require('mongoose');

const roleRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    requestedRole: { type: String, enum: ['admin', 'analyst', 'viewer'], required: true },
    message: { type: String },
    source: { type: String, default: 'login' },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'approved', 'denied'], default: 'pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoleRequest', roleRequestSchema);
