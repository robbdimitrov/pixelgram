function timeFormat() {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ` +
    `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.` +
    `${date.getMilliseconds()}`;
}

function logError(message) {
  process.stderr.write(`[${timeFormat()}] ${message}\n`);
}

function logInfo(message) {
  process.stdout.write(`[${timeFormat()}] ${message}\n`);
}

module.exports = {
  logError,
  logInfo
};
