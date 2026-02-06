function logInfo(message, meta) {
  if (meta) {
    console.log(message, meta);
    return;
  }
  console.log(message);
}

function logError(message, meta) {
  if (meta) {
    console.error(message, meta);
    return;
  }
  console.error(message);
}

module.exports = { logInfo, logError };
