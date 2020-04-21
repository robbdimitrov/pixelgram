const http = require('http')

const createApp = require('./src');
const DbClient = require('./src/db');
const logger = require('./src/shared/logger');

const port = process.env.PORT || '8080';
const dbUrl = process.env.DATABASE_URL;
const imageDir = process.env.IMAGE_DIR;

const dbClient = new DbClient(dbUrl);
const app = createApp(dbClient, imageDir);
const server = http.createServer(app);

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Stop server, close database connection
function shutdown() {
  logger.logInfo('Server is shutting down...');
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
  logger.logInfo(`Server is starting on port ${port}`);
  server.listen(port);
}
