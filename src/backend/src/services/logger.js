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

function getEnvironment() {
  return process.env.NODE_ENV ? '' : 'DEBUG ';
}

function logError(message) {
  process.stderr.write(`${getEnvironment()}[${timeFormat()}] ${message}\n`);
}

function logInfo(message) {
  process.stdout.write(`${getEnvironment()}[${timeFormat()}] ${message}\n`);
}

module.exports = {
  logError,
  logInfo
};
