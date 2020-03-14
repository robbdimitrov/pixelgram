function dateString() {
  const date = new Date();
  return date.toISOString();
}

function logError(message) {
  console.error(`[${dateString()}] ${message}`);
}

function logInfo(message) {
  console.log(`[${dateString()}] ${message}`);
}

module.exports = {
  logError,
  logInfo
};
