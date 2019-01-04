import { Server } from './server';
import { DBClient } from './services/db-client';

const port = +(process.env.PORT || '');
const apiRootPath = process.env.API_ROOT || '';
const imageDir = process.env.IMAGE_DIR || '';
const dbHost = process.env.DB_HOST || '';
const dbPort = +(process.env.DB_PORT || '');
const dbName = process.env.DB_NAME || '';

// Create a server instance
const dbClient = new DBClient(dbHost, dbPort, dbName);

const server = new Server(port, apiRootPath, imageDir, dbClient);

// Export Express Application instance
export default server.app;
