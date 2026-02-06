const AuditLog = require('../models/AuditLog');

async function listAuditLogs(req, res, next) {
  try {
    const { recordType, actor, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const query = {};
    if (recordType) query.recordType = recordType;
    if (actor) query.actor = actor;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      AuditLog.countDocuments(query)
    ]);

    return res.json({ items, page: pageNum, limit: limitNum, total });
  } catch (err) {
    return next(err);
  }
}

async function getTimeline(req, res, next) {
  try {
    const { recordType, recordId } = req.params;
    const logs = await AuditLog.find({ recordType, recordId })
      .sort({ createdAt: 1 })
      .lean();
    return res.json({ recordType, recordId, timeline: logs });
  } catch (err) {
    return next(err);
  }
}

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function exportAuditCsv(req, res, next) {
  try {
    const { recordType, actor, dateFrom, dateTo } = req.query;
    const query = {};
    if (recordType) query.recordType = recordType;
    if (actor) query.actor = actor;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).lean();
    const header = ['createdAt', 'recordType', 'recordId', 'actor', 'action', 'changes'];
    const lines = [header.join(',')];
    for (const log of logs) {
      const row = [
        escapeCsv(log.createdAt),
        escapeCsv(log.recordType),
        escapeCsv(log.recordId),
        escapeCsv(log.actor || ''),
        escapeCsv(log.action),
        escapeCsv(JSON.stringify(log.changes || {}))
      ];
      lines.push(row.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=\"audit_logs.csv\"');
    return res.send(lines.join('\n'));
  } catch (err) {
    return next(err);
  }
}

module.exports = { listAuditLogs, getTimeline, exportAuditCsv };
