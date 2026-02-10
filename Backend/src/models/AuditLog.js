const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    recordType: { type: String, required: true, immutable: true },
    recordId: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', immutable: true },
    action: { type: String, required: true, immutable: true },
    changes: { type: Object, immutable: true },
    createdAt: { type: Date, default: Date.now, immutable: true }
  },
  { timestamps: false, strict: true }
);

auditLogSchema.index({ recordType: 1, recordId: 1, createdAt: -1 });

function blockUpdates(next) {
  next(new Error('Audit logs are immutable'));
}

auditLogSchema.pre('updateOne', blockUpdates);
auditLogSchema.pre('updateMany', blockUpdates);
auditLogSchema.pre('findOneAndUpdate', blockUpdates);
auditLogSchema.pre('deleteOne', blockUpdates);
auditLogSchema.pre('deleteMany', blockUpdates);
auditLogSchema.pre('findOneAndDelete', blockUpdates);
auditLogSchema.pre('findByIdAndDelete', blockUpdates);

module.exports = mongoose.model('AuditLog', auditLogSchema);
