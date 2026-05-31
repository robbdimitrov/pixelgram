function logInfo(message: string) {
  console.log(`${new Date().toISOString()} ${message}`);
}

function logError(message: string) {
  console.error(`${new Date().toISOString()} ${message}`);
}

export {
  logInfo,
  logError
};
