const { Queue } = require('bullmq');
const { connection } = require('../config/redis');

const uploadQueue = new Queue('uploadQueue', { connection });

async function enqueueUpload(uploadJobId) {
  await uploadQueue.add('processUpload', { uploadJobId });
}

module.exports = { uploadQueue, enqueueUpload };
