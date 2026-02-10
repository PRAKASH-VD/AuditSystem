const UploadJob = require('../models/UploadJob');
const RejectedRow = require('../models/RejectedRow');
const { enqueueUpload } = require('../queues/uploadQueue');
const { parseFilePreview } = require('../services/fileParser');
const { env } = require('../config/env');
const { mappingSchema } = require('../validators/upload.validator');

async function createUploadJob(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }
    const preview = await parseFilePreview(req.file.path, 20, req.file.originalname, env.MAX_ROWS);
    let mapping;
    if (req.body.mapping) {
      if (typeof req.body.mapping === 'string') {
        try {
          mapping = JSON.parse(req.body.mapping);
        } catch (err) {
          return res.status(400).json({ message: 'Invalid mapping JSON' });
        }
      } else {
        mapping = req.body.mapping;
      }
    }
    if (mapping) {
      const { error } = mappingSchema.validate(mapping);
      if (error) {
        return res.status(400).json({ message: 'Invalid mapping', details: error.details });
      }
    }
    if (mapping) {
      const errors = validateMappingAgainstPreview(mapping, preview);
      if (errors) {
        return res.status(400).json({ message: 'Mapping validation failed', details: errors });
      }
    }
    const job = await UploadJob.create({
      filename: req.file.originalname,
      path: req.file.path,
      status: 'processing',
      uploadedBy: req.user._id,
      mapping,
      preview
    });
    await enqueueUpload(job._id.toString());
    return res.status(202).json({ jobId: job._id });
  } catch (err) {
    return next(err);
  }
}

async function getUploadJob(req, res, next) {
  try {
    const job = await UploadJob.findById(req.params.id).lean();
    if (!job) {
      return res.status(404).json({ message: 'Not found' });
    }
    return res.json({ ...job, reusedResults: Boolean(job.reusedFrom) });
  } catch (err) {
    return next(err);
  }
}

async function listUploadJobs(req, res, next) {
  try {
    const { status, uploadedBy, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (uploadedBy) query.uploadedBy = uploadedBy;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      UploadJob.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      UploadJob.countDocuments(query)
    ]);

    const normalized = items.map((item) => ({
      ...item,
      reusedResults: Boolean(item.reusedFrom)
    }));

    return res.json({ items: normalized, page: pageNum, limit: limitNum, total });
  } catch (err) {
    return next(err);
  }
}

async function previewUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }
    const preview = await parseFilePreview(req.file.path, 20, req.file.originalname, env.MAX_ROWS);
    const job = await UploadJob.create({
      filename: req.file.originalname,
      path: req.file.path,
      status: 'draft',
      uploadedBy: req.user._id,
      preview
    });
    return res.json({ jobId: job._id, preview });
  } catch (err) {
    return next(err);
  }
}

function isNumberLike(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (typeof value === 'string') return value.trim() !== '' && !Number.isNaN(Number(value));
  return false;
}

function isDateLike(value) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function validateMappingAgainstPreview(mapping, preview) {
  if (!preview || !preview.rows || preview.rows.length === 0) return null;
  const sampleRows = preview.rows.slice(0, 10);
  const errors = [];

  const amountKey = mapping.amount;
  const dateKey = mapping.date;
  const transactionKey = mapping.transactionId;

  const amountOk = sampleRows.some((row) => isNumberLike(row[amountKey]));
  const dateOk = sampleRows.some((row) => isDateLike(row[dateKey]));
  const transactionOk = sampleRows.some((row) => String(row[transactionKey] || '').trim() !== '');

  if (!amountOk) errors.push('Amount column must contain numeric values.');
  if (!dateOk) errors.push('Date column must contain valid dates.');
  if (!transactionOk) errors.push('Transaction ID column must contain values.');

  return errors.length ? errors : null;
}

async function submitUploadJob(req, res, next) {
  try {
    const job = await UploadJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Not found' });
    }
    if (job.status !== 'draft') {
      return res.status(400).json({ message: 'Upload job already submitted' });
    }
    let mapping;
    if (req.body.mapping) {
      if (typeof req.body.mapping === 'string') {
        try {
          mapping = JSON.parse(req.body.mapping);
        } catch (err) {
          return res.status(400).json({ message: 'Invalid mapping JSON' });
        }
      } else {
        mapping = req.body.mapping;
      }
    }
    if (mapping) {
      const { error } = mappingSchema.validate(mapping);
      if (error) {
        return res.status(400).json({ message: 'Invalid mapping', details: error.details });
      }
    }
    if (mapping) {
      const errors = validateMappingAgainstPreview(mapping, job.preview);
      if (errors) {
        return res.status(400).json({ message: 'Mapping validation failed', details: errors });
      }
    }
    job.mapping = mapping;
    job.status = 'processing';
    await job.save();
    await enqueueUpload(job._id.toString());
    return res.status(202).json({ jobId: job._id });
  } catch (err) {
    return next(err);
  }
}

async function getPreview(req, res, next) {
  try {
    const job = await UploadJob.findById(req.params.id).lean();
    if (!job) {
      return res.status(404).json({ message: 'Not found' });
    }
    return res.json({ jobId: job._id, preview: job.preview || { headers: [], rows: [] } });
  } catch (err) {
    return next(err);
  }
}

async function listRejectedRows(req, res, next) {
  try {
    const uploadJob = await UploadJob.findById(req.params.id).select('_id').lean();
    if (!uploadJob) {
      return res.status(404).json({ message: 'Not found' });
    }

    const pageNum = Number(req.query.page) || 1;
    const limitNum = Number(req.query.limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      RejectedRow.find({ uploadJob: uploadJob._id })
        .sort({ rowNumber: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      RejectedRow.countDocuments({ uploadJob: uploadJob._id })
    ]);

    return res.json({ items, page: pageNum, limit: limitNum, total });
  } catch (err) {
    return next(err);
  }
}

async function getAdminMonitoring(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const query = {};
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const [statusBuckets, recentFailures, activeJobs] = await Promise.all([
      UploadJob.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      UploadJob.find({ ...query, status: 'failed' })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select('_id filename error updatedAt uploadedBy')
        .lean(),
      UploadJob.find({ ...query, status: 'processing' })
        .sort({ updatedAt: -1 })
        .limit(20)
        .select('_id filename stats updatedAt uploadedBy')
        .lean()
    ]);

    const status = {
      draft: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };
    for (const bucket of statusBuckets) {
      if (status[bucket._id] !== undefined) status[bucket._id] = bucket.count;
    }

    return res.json({
      status,
      activeJobs,
      recentFailures
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createUploadJob,
  getUploadJob,
  listUploadJobs,
  previewUpload,
  submitUploadJob,
  getPreview,
  listRejectedRows,
  getAdminMonitoring
};
