const mongoose = require('mongoose');

const rejectedRowSchema = new mongoose.Schema(
  {
    uploadJob: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadJob', required: true, index: true },
    rowNumber: { type: Number, required: true },
    reason: { type: String, required: true },
    raw: { type: Object, required: true }
  },
  { timestamps: true }
);

rejectedRowSchema.index({ uploadJob: 1, rowNumber: 1 });

module.exports = mongoose.model('RejectedRow', rejectedRowSchema);
