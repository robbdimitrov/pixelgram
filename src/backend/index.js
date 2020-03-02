const Server = require('./src/server');

const port = process.env.PORT;
const dbUrl = process.env.DATABASE_URL;
const secret = process.env.SECRET;
const imageDir = process.env.IMAGE_DIR;

const server = new Server(port, dbUrl, secret, imageDir);

if (!module.parent) {
  server.start();
}
