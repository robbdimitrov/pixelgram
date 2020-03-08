const Server = require('./src/server');

const port = process.env.PORT;
const dbUrl = process.env.DATABASE_URL;
const imageDir = process.env.IMAGE_DIR;

const server = new Server(port, dbUrl, imageDir);

if (!module.parent) {
  server.start();
}
