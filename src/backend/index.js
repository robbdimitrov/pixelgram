const http = require('http')

const createApp = require('./src');
const DbClient = require('./src/db');
const {logInfo} = require('./src/shared/logger');

const port = process.env.PORT || '8080';
const dbUrl = process.env.DATABASE_URL;
const imageDir = process.env.IMAGE_DIR;

const dbClient = new DbClient(dbUrl);
const app = createApp(dbClient, imageDir);
const server = http.createServer(app);

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  logInfo('Server is shutting down...');
  setTimeout(() => {
    process.exit(1);
  }, 10000);
  server.close(() => {
    dbClient.close(() => {
      process.exit(0);
    });
  });
}

if (require.main) {
  logInfo(`Server is starting on port ${port}`);
  server.listen(port);
}
