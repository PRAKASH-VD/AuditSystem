const mongoose = require('mongoose');

const uploadJobSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    path: { type: String, required: true },
    status: { type: String, enum: ['draft', 'processing', 'completed', 'failed'], default: 'draft' },
    error: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stats: {
      total: { type: Number, default: 0 },
      matched: { type: Number, default: 0 },
      unmatched: { type: Number, default: 0 },
      duplicate: { type: Number, default: 0 },
      partial: { type: Number, default: 0 },
      processed: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    },
    fingerprint: { type: String },
    reusedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadJob' },
    mapping: {
      transactionId: { type: String },
      amount: { type: String },
      referenceNumber: { type: String },
      date: { type: String }
    },
    preview: {
      headers: { type: [String], default: [] },
      rows: { type: [Object], default: [] }
    }
  },
  { timestamps: true }
);

uploadJobSchema.index({ status: 1, createdAt: -1 });
uploadJobSchema.index({ uploadedBy: 1, createdAt: -1 });
uploadJobSchema.index({ fingerprint: 1 });
uploadJobSchema.index({ reusedFrom: 1 });

module.exports = mongoose.model('UploadJob', uploadJobSchema);
