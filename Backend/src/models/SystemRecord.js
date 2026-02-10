const mongoose = require('mongoose');

const systemRecordSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    referenceNumber: { type: String, index: true },
    date: { type: Date, required: true }
  },
  { timestamps: true }
);

systemRecordSchema.index({ transactionId: 1, amount: 1 });
systemRecordSchema.index({ referenceNumber: 1 });

module.exports = mongoose.model('SystemRecord', systemRecordSchema);
