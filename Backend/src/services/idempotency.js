const FileFingerprint = require('../models/FileFingerprint');

async function reserveFingerprint(fingerprint, uploadJobId) {
  try {
    const created = await FileFingerprint.create({
      fingerprint,
      uploadJob: uploadJobId,
      status: 'processing'
    });
    return { reserved: true, doc: created.toObject() };
  } catch (err) {
    if (err?.code !== 11000) throw err;
    const existing = await FileFingerprint.findOne({ fingerprint }).lean();
    return { reserved: false, doc: existing };
  }
}

async function tryClaimFailedFingerprint(fingerprint, uploadJobId) {
  const updated = await FileFingerprint.findOneAndUpdate(
    { fingerprint, status: 'failed' },
    { uploadJob: uploadJobId, status: 'processing', lastError: null },
    { new: true }
  ).lean();
  return updated;
}

async function markFingerprintCompleted(fingerprint, uploadJobId) {
  await FileFingerprint.updateOne(
    { fingerprint, uploadJob: uploadJobId },
    { status: 'completed', lastError: null }
  );
}

async function markFingerprintFailed(fingerprint, uploadJobId, message) {
  await FileFingerprint.updateOne(
    { fingerprint, uploadJob: uploadJobId },
    { status: 'failed', lastError: message || 'Unknown processing error' }
  );
}

module.exports = {
  reserveFingerprint,
  tryClaimFailedFingerprint,
  markFingerprintCompleted,
  markFingerprintFailed
};
