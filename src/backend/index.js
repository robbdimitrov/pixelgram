const Server = require('./src/server');
const DBClient = require('./src/services/db-client');

const port = process.env.PORT;
const dbUrl = process.env.DATABASE_URL;
const imageDir = process.env.IMAGE_DIR || '/data/images';

const dbClient = new DBClient(dbUrl);
const server = new Server(port, dbClient, imageDir);

if (!module.parent) {
  server.start();
}