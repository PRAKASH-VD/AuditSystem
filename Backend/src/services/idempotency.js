const FileFingerprint = require('../models/FileFingerprint');

async function isDuplicateFingerprint(fingerprint) {
  const existing = await FileFingerprint.findOne({ fingerprint }).lean();
  return existing;
}

async function saveFingerprint(fingerprint, uploadJobId) {
  return FileFingerprint.create({ fingerprint, uploadJob: uploadJobId });
}

module.exports = { isDuplicateFingerprint, saveFingerprint };
