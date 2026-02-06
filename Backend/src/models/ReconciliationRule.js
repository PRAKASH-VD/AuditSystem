const mongoose = require('mongoose');

const reconciliationRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['exact', 'partial', 'duplicate', 'unmatched'], required: true },
    config: { type: Object, default: {} },
    priority: { type: Number, default: 1 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

reconciliationRuleSchema.index({ active: 1, priority: 1 });

module.exports = mongoose.model('ReconciliationRule', reconciliationRuleSchema);
