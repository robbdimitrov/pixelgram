import { Server } from './server';
import { DBClient } from './services/db-client';

const port = Number(process.env.PORT || '');
const apiRootPath = process.env.API_ROOT || '';
const imageDir = process.env.IMAGE_DIR || '';
const dbUrl = process.env.DB_URI || '';

// Create a server instance
const dbClient = new DBClient(dbUrl);
const server = new Server(port, apiRootPath, imageDir, dbClient);

// Export Express Application instance
export default server.app;
