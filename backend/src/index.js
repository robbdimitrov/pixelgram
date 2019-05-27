import { Server } from './server';
import { DBClient } from './services/db-client';

const dbUrl = process.env.DB_URI || '';

const dbClient = new DBClient(dbUrl);
const server = new Server(dbClient);

if (!module.parent) {
  server.start();
}
