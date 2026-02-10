const mongoose = require('mongoose');

const fileFingerprintSchema = new mongoose.Schema(
  {
    fingerprint: { type: String, required: true, unique: true },
    uploadJob: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadJob', required: true },
    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
    lastError: { type: String }
  },
  { timestamps: true }
);

fileFingerprintSchema.index({ status: 1, updatedAt: -1 });

module.exports = mongoose.model('FileFingerprint', fileFingerprintSchema);
