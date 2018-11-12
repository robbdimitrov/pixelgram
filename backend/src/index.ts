import * as config from '../config/server.config';
import { Server } from './server';
import { DBClient } from './services/db-client';

// Create a server instance
const port = config.port || 3000;
const apiRootPath = config.apiRootPath || 'api';
const apiVersion = config.apiVersion || 1.0;
const dbClient = new DBClient(config.dbURI);

const server = new Server(port, apiRootPath, apiVersion, dbClient);

// Export Express Application instance
export default server.app;
