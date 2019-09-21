const Server = require('./server');
const DBClient = require('./services/db-client');

const port = process.env.PORT;
const dbUrl = process.env.DATABASE_URI;

const dbClient = new DBClient(dbUrl);
const server = new Server(port, dbClient);

if (!module.parent) {
  server.start();
}
