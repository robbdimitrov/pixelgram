const Server = require('./src/server');
const UserClient = require('./src/services/user-client');
const ImageClient = require('./src/services/image-client');

const port = process.env.PORT;
const dbUrl = process.env.DATABASE_URL;
const imageDir = process.env.IMAGE_DIR || '/data/images';

const userClient = new UserClient(dbUrl);
const imageClient = new ImageClient(dbUrl);
const server = new Server(port, userClient, imageClient, imageDir);

if (!module.parent) {
  server.start();
}
