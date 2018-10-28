import { Server } from './server';
import { DBClient } from './data/db-client';
import { DBWorker } from './data/db-worker';
import * as config from '../config/server.config';

// Create a server instance
const port = config.port || 3000;
const apiRootPath = config.apiRootPath || 'api';
const apiVersion = config.apiVersion || 1.0;
const dbClient = new DBWorker(config.dbURI);

const server = new Server(port, apiRootPath, apiVersion, dbClient);

// Export Express Application instance
export default server.app;
