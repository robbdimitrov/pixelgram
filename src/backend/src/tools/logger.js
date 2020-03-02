function timeFormat() {
  const date = new Date();
  return `${date.getFullYear()}-${format(date.getMonth() + 1)}-${format(date.getDate())}T` +
    `${format(date.getHours())}:${format(date.getMinutes())}:${format(date.getSeconds())}.` +
    `${getMilliseconds(date)}`;
}

function format(num) {
  return ('0' + num).slice(-2);
}

function getMilliseconds(date) {
  return (date.getMilliseconds() + '00').slice(0, 3);
}

function logError(message) {
  console.error(`[${timeFormat()}] ${message}`);
}

function logInfo(message) {
  console.log(`[${timeFormat()}] ${message}`);
}

module.exports = {
  logError,
  logInfo
};
