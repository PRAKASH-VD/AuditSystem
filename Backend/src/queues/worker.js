const { Worker } = require('bullmq');
const { connectDb } = require('../config/db');
const { connection } = require('../config/redis');
const UploadJob = require('../models/UploadJob');
const UploadedRecord = require('../models/UploadedRecord');
const SystemRecord = require('../models/SystemRecord');
const ReconciliationResult = require('../models/ReconciliationResult');
const RejectedRow = require('../models/RejectedRow');
const AuditLog = require('../models/AuditLog');
const { parseFile } = require('../services/fileParser');
const { evaluateRules } = require('../services/reconciliationEngine');
const { ensureDefaultRules, getActiveRules } = require('../services/reconciliationRules');
const { hashBuffer } = require('../utils/hash');
const {
  reserveFingerprint,
  tryClaimFailedFingerprint,
  markFingerprintCompleted,
  markFingerprintFailed
} = require('../services/idempotency');
const { env } = require('../config/env');

function resolveField(raw, mapping, fallbackKeys) {
  if (mapping && mapping[fallbackKeys[0]]) {
    const key = mapping[fallbackKeys[0]];
    return raw[key];
  }
  for (const key of fallbackKeys) {
    if (raw[key] !== undefined) return raw[key];
  }
  return undefined;
}

function buildUploadedRecord(raw, mapping) {
  const transactionId = String(resolveField(raw, mapping, ['transactionId', 'Transaction ID']) || '').trim();
  if (!transactionId) throw new Error('Missing Transaction ID');

  const amount = Number(resolveField(raw, mapping, ['amount', 'Amount']) || 0);
  if (Number.isNaN(amount)) throw new Error('Invalid Amount');

  const dateValue = resolveField(raw, mapping, ['date', 'Date']) || Date.now();
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid Date');

  return {
    transactionId,
    amount,
    referenceNumber: String(resolveField(raw, mapping, ['referenceNumber', 'Reference Number']) || '').trim(),
    date,
    raw
  };
}

function buildDuplicateKeyQuery(uploaded) {
  const dayStart = new Date(uploaded.date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return {
    transactionId: uploaded.transactionId,
    referenceNumber: uploaded.referenceNumber,
    amount: uploaded.amount,
    date: { $gte: dayStart, $lt: dayEnd }
  };
}

async function processUpload(job) {
  const uploadJobId = job.data.uploadJobId;
  const uploadJob = await UploadJob.findById(uploadJobId);
  if (!uploadJob) return;
  if (uploadJob.status === 'draft') return;
  let fingerprint;
  let claimedByCurrentJob = false;

  try {
    const buffer = require('fs').readFileSync(uploadJob.path);
    fingerprint = hashBuffer(buffer);

    const reservation = await reserveFingerprint(fingerprint, uploadJob._id);
    if (reservation.reserved) {
      claimedByCurrentJob = true;
    } else if (reservation.doc?.uploadJob?.toString() !== uploadJob._id.toString()) {
      if (reservation.doc?.status === 'failed') {
        const claim = await tryClaimFailedFingerprint(fingerprint, uploadJob._id);
        if (claim) {
          claimedByCurrentJob = true;
        }
      }
      if (!claimedByCurrentJob) {
        if (reservation.doc?.status === 'completed') {
          const originalJob = await UploadJob.findById(reservation.doc.uploadJob).lean();
          uploadJob.status = 'completed';
          uploadJob.fingerprint = fingerprint;
          uploadJob.reusedFrom = reservation.doc.uploadJob;
          if (originalJob?.stats) {
            uploadJob.stats = originalJob.stats;
          }
          await uploadJob.save();
          return;
        }
        uploadJob.status = 'failed';
        uploadJob.fingerprint = fingerprint;
        uploadJob.error = `Duplicate upload is already processing in job ${reservation.doc?.uploadJob}`;
        await uploadJob.save();
        return;
      }
    }

    const records = await parseFile(uploadJob.path, uploadJob.filename, env.MAX_ROWS);
    const rules = await getActiveRules();
    const batchSize = env.BATCH_SIZE;
    let stats = { total: 0, matched: 0, unmatched: 0, duplicate: 0, partial: 0, processed: 0, skipped: 0, failed: 0 };

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      for (let offset = 0; offset < batch.length; offset += 1) {
        const raw = batch[offset];
        const rowNumber = i + offset + 1;
        try {
          const uploaded = buildUploadedRecord(raw, uploadJob.mapping);
          const saved = await UploadedRecord.create({ ...uploaded, uploadJob: uploadJob._id });
          const duplicateKeyQuery = buildDuplicateKeyQuery(uploaded);
          const duplicateCount = await UploadedRecord.countDocuments({ ...duplicateKeyQuery, uploadJob: uploadJob._id });
          const duplicateCountGlobal = await UploadedRecord.countDocuments(duplicateKeyQuery);
          const system = await SystemRecord.findOne({ transactionId: uploaded.transactionId });
          const { status, mismatches } = evaluateRules({
            uploaded,
            system,
            duplicateCount,
            duplicateCountGlobal,
            rules
          });

          await ReconciliationResult.create({
            uploadJob: uploadJob._id,
            uploadedRecord: saved._id,
            systemRecord: system ? system._id : undefined,
            status,
            mismatches
          });

          await AuditLog.create({
            recordType: 'UploadedRecord',
            recordId: saved._id,
            action: 'reconciled',
            changes: { status }
          });

          stats.total += 1;
          stats.processed += 1;
          if (status === 'exact') stats.matched += 1;
          if (status === 'partial') stats.partial += 1;
          if (status === 'duplicate') stats.duplicate += 1;
          if (status === 'unmatched') stats.unmatched += 1;
        } catch (err) {
          await RejectedRow.create({
            uploadJob: uploadJob._id,
            rowNumber,
            reason: err.message || 'Unknown row processing error',
            raw
          });
          stats.failed += 1;
          stats.skipped += 1;
        }
      }
      uploadJob.stats = stats;
      await uploadJob.save();
    }

    uploadJob.status = 'completed';
    uploadJob.stats = stats;
    uploadJob.fingerprint = fingerprint;
    await uploadJob.save();
    if (claimedByCurrentJob) {
      await markFingerprintCompleted(fingerprint, uploadJob._id);
    }
  } catch (err) {
    uploadJob.status = 'failed';
    if (fingerprint) {
      uploadJob.fingerprint = fingerprint;
    }
    uploadJob.error = err.message;
    await uploadJob.save();
    if (claimedByCurrentJob && fingerprint) {
      await markFingerprintFailed(fingerprint, uploadJob._id, err.message);
    }
    throw err;
  }
}

connectDb()
  .then(() => {
    console.log('Worker MongoDB connected');
    return ensureDefaultRules();
  })
  .catch((err) => {
    console.error('Worker failed to connect MongoDB', err);
    process.exit(1);
  });

const worker = new Worker('uploadQueue', processUpload, { connection });

worker.on('failed', (job, err) => {
  console.error('Job failed', job.id, err);
});

module.exports = { worker };
