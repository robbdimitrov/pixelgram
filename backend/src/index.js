import { Server } from './server';
import { DBClient } from './services/db-client';

const port = process.env.PORT;
const dbUrl = process.env.DATABASE_URI;

const dbClient = new DBClient(dbUrl);
const server = new Server(port, dbClient);

if (!module.parent) {
  server.start();
}
