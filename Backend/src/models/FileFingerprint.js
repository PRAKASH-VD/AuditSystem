const mongoose = require('mongoose');

const fileFingerprintSchema = new mongoose.Schema(
  {
    fingerprint: { type: String, required: true, unique: true },
    uploadJob: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadJob', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FileFingerprint', fileFingerprintSchema);
