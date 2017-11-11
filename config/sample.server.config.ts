// Sample config. Copy to server.config.ts and add settings.
//
// dbURI looks like mongodb://<user>:<pass>@<server>:<mongo-port: default: 27017>/<database-name>
// Default Node port is 3000
// apiVersion and apiRootPath are used as an API prefix. Example <server>/api/1.0/
// secret is used to sign JSON Web Tokens
//

export const dbURI = '';
export const port = 3000;
export const apiVersion = 1.0;
export const apiRootPath = 'api';
export const secret = 'secret';
