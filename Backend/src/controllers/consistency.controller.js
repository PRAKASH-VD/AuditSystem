const ReconciliationResult = require('../models/ReconciliationResult');
const UploadJob = require('../models/UploadJob');

async function getConsistencyReport(req, res, next) {
  try {
    const { id } = req.params;
    const job = await UploadJob.findById(id).lean();
    if (!job) {
      return res.status(404).json({ message: 'Not found' });
    }

    const aggregation = await ReconciliationResult.aggregate([
      { $match: { uploadJob: job.reusedFrom || job._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counts = aggregation.reduce(
      (acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
      },
      { exact: 0, partial: 0, duplicate: 0, unmatched: 0 }
    );

    return res.json({
      jobId: job._id,
      reusedFrom: job.reusedFrom || null,
      jobStats: job.stats || {},
      reconciliationCounts: {
        matched: counts.exact,
        partial: counts.partial,
        duplicate: counts.duplicate,
        unmatched: counts.unmatched
      }
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getConsistencyReport };
