function isEqualField(uploaded, system, field) {
  return uploaded[field] !== undefined && system && uploaded[field] === system[field];
}

function evaluateRules({ uploaded, system, duplicateCount, duplicateCountGlobal, rules }) {
  for (const rule of rules) {
    if (rule.type === 'duplicate') {
      if (duplicateCount > 1 || duplicateCountGlobal > 1) {
        return { status: 'duplicate', mismatches: [] };
      }
    }
    if (rule.type === 'exact') {
      if (!system) continue;
      const fields = rule.config?.matchFields || [];
      const ok = fields.every((field) => isEqualField(uploaded, system, field));
      if (ok) return { status: 'exact', mismatches: [] };
    }
    if (rule.type === 'partial') {
      if (!system) continue;
      const matchField = rule.config?.matchField;
      const tolerance = Number(rule.config?.amountVariancePercent ?? 0.02);
      if (matchField && isEqualField(uploaded, system, matchField)) {
        const variance = Math.abs(uploaded.amount - system.amount) / (system.amount || 1);
        if (variance <= tolerance) {
          return { status: 'partial', mismatches: ['amount'] };
        }
      }
    }
    if (rule.type === 'unmatched') {
      return { status: 'unmatched', mismatches: ['transactionId', 'amount'] };
    }
  }
  return { status: 'unmatched', mismatches: ['transactionId', 'amount'] };
}

module.exports = { evaluateRules };
