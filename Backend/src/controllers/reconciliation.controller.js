const ReconciliationResult = require('../models/ReconciliationResult');
const UploadedRecord = require('../models/UploadedRecord');
const AuditLog = require('../models/AuditLog');
const UploadJob = require('../models/UploadJob');

async function listResults(req, res, next) {
  try {
    const { status, uploadJob, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (uploadJob) {
      const job = await UploadJob.findById(uploadJob).lean();
      query.uploadJob = job?.reusedFrom || uploadJob;
    }
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      ReconciliationResult.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      ReconciliationResult.countDocuments(query)
    ]);

    return res.json({
      items,
      page: pageNum,
      limit: limitNum,
      total
    });
  } catch (err) {
    return next(err);
  }
}

async function getResult(req, res, next) {
  try {
    const result = await ReconciliationResult.findById(req.params.id)
      .populate('uploadedRecord')
      .populate('systemRecord')
      .lean();
    if (!result) {
      return res.status(404).json({ message: 'Not found' });
    }
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function manualUpdate(req, res, next) {
  try {
    const result = await ReconciliationResult.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Not found' });
    }

    const changes = {};
    if (req.body.uploadedRecord) {
      const uploaded = await UploadedRecord.findById(result.uploadedRecord);
      if (uploaded) {
        const before = {
          transactionId: uploaded.transactionId,
          amount: uploaded.amount,
          referenceNumber: uploaded.referenceNumber,
          date: uploaded.date
        };
        Object.assign(uploaded, req.body.uploadedRecord);
        await uploaded.save();
        changes.uploadedRecord = { before, after: req.body.uploadedRecord };
      }
    }

    if (req.body.status) {
      changes.status = { before: result.status, after: req.body.status };
      result.status = req.body.status;
    }
    if (req.body.notes) {
      changes.notes = { before: result.notes, after: req.body.notes };
      result.notes = req.body.notes;
    }

    await result.save();

    await AuditLog.create({
      recordType: 'ReconciliationResult',
      recordId: result._id,
      actor: req.user?._id,
      action: 'manual_update',
      changes
    });

    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listResults, getResult, manualUpdate };
