// Sample config. Copy to server.config.ts and add settings.
//
// dbURI - looks like mongodb://<user>:<pass>@<server>:<mongo-port: default: 27017>/<database-name>
// port - Default Node port is 3000
// apiVersion and apiRootPath are used as an API prefix. Example <server>/api/1.0/
// secret - used to sign JSON Web Tokens
// imageDir - the directory where images are stored
//

export const dbURI = 'mongodb://mongo:27017/pixelgram-db';
export const port = 3000;
export const apiVersion = 1.0;
export const apiRootPath = 'api';
export const secret = 'secret';
export const imageDir = 'uploads/'
