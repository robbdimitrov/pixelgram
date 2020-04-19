const http = require('http')

const DbClient = require('./src/db');
const createControllers = require('./src/controllers');
const createApp = require('./src');
const logger = require('./src/shared/logger');

const port = process.env.PORT;
const dbUrl = process.env.DATABASE_URL;
const imageDir = process.env.IMAGE_DIR;

const dbClient = new DbClient(dbUrl);
const controllers = createControllers(dbClient);

const server = http.createServer(createApp(imageDir, controllers));

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Stop server, close database connection
function shutdown() {
  logger.logInfo('Shutting down...');
  setTimeout(() => {
    process.exit(1);
  }, 10000);
  server.close(() => {
    dbClient.close(() => {
      process.exit(0);
    });
  });
}

if (!module.parent) {
  logger.logInfo(`Starting server on port ${port}`);
  server.listen(port);
}
