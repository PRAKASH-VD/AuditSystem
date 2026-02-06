const mongoose = require('mongoose');

const uploadedRecordSchema = new mongoose.Schema(
  {
    uploadJob: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadJob', required: true },
    transactionId: { type: String, required: true },
    amount: { type: Number, required: true },
    referenceNumber: { type: String },
    date: { type: Date, required: true },
    raw: { type: Object }
  },
  { timestamps: true }
);

uploadedRecordSchema.index({ uploadJob: 1, transactionId: 1 });

module.exports = mongoose.model('UploadedRecord', uploadedRecordSchema);
