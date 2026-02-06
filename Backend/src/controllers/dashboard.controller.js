const UploadJob = require('../models/UploadJob');

function buildDateFilter(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return undefined;
  const filter = {};
  if (dateFrom) filter.$gte = new Date(dateFrom);
  if (dateTo) filter.$lte = new Date(dateTo);
  return filter;
}

async function getSummary(req, res, next) {
  try {
    const { dateFrom, dateTo, status, uploadedBy } = req.query;
    const query = {};
    const createdAt = buildDateFilter(dateFrom, dateTo);
    if (createdAt) query.createdAt = createdAt;
    if (status) query.status = status;
    if (uploadedBy) query.uploadedBy = uploadedBy;

    const jobs = await UploadJob.find(query).lean();
    const summary = jobs.reduce(
      (acc, job) => {
        acc.totalRecords += job.stats?.total || 0;
        acc.matched += job.stats?.matched || 0;
        acc.unmatched += job.stats?.unmatched || 0;
        acc.duplicate += job.stats?.duplicate || 0;
        acc.partial += job.stats?.partial || 0;
        return acc;
      },
      { totalRecords: 0, matched: 0, unmatched: 0, duplicate: 0, partial: 0 }
    );
    const accuracy = summary.totalRecords
      ? Number(((summary.matched / summary.totalRecords) * 100).toFixed(2))
      : 0;

    const statusChart = [
      { label: 'Matched', value: summary.matched },
      { label: 'Unmatched', value: summary.unmatched },
      { label: 'Duplicate', value: summary.duplicate },
      { label: 'Partial', value: summary.partial }
    ];

    const daily = await UploadJob.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalRecords: { $sum: '$stats.total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const barChart = daily.map((item) => ({ date: item._id, value: item.totalRecords || 0 }));

    return res.json({
      summary,
      accuracy,
      charts: {
        statusChart,
        barChart
      }
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getSummary };
