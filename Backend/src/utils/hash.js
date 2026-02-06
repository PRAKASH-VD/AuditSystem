const crypto = require('crypto');

function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function hashString(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

module.exports = { hashBuffer, hashString };
