const mongoose = require('mongoose');

const reconciliationResultSchema = new mongoose.Schema(
  {
    uploadJob: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadJob', required: true },
    uploadedRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadedRecord', required: true },
    systemRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'SystemRecord' },
    status: { type: String, enum: ['exact', 'partial', 'duplicate', 'unmatched'], required: true },
    mismatches: { type: [String], default: [] },
    notes: { type: String }
  },
  { timestamps: true }
);

reconciliationResultSchema.index({ uploadJob: 1, status: 1 });
reconciliationResultSchema.index({ status: 1, createdAt: -1 });
reconciliationResultSchema.index({ uploadJob: 1, createdAt: -1 });
reconciliationResultSchema.index({ uploadJob: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('ReconciliationResult', reconciliationResultSchema);
