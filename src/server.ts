import * as express             from "express";
import * as bodyParser          from 'body-parser';
import * as config              from "../config/env";

import { DBClient }             from './dbclient';
import { ImageRouter }          from './routes/image-router';
import { SessionRouter }        from './routes/session-router';
import { UserRouter }           from './routes/user-router';

export class Server {

    port: number;
    app: express.Application;
    dbClient: DBClient;
    apiRootPath: string;
    apiVersion: number;

    constructor() {
        this.app = express();
        this.dbClient = new DBClient(config.dbURI);
        this.port = 3000;
        this.apiVersion = 1.0;
        this.apiRootPath = 'api';

        this.configure();

        this.start();
    }

    // Configure Express middleware
    configure() {
        this.app.use(bodyParser.urlencoded({ extended: true }));

        this.routes();
    }

    apiRoot(): string {
        return `${this.apiRootPath}/v${this.apiVersion.toFixed(1)}`;
    }

    // Configure API endpoints
    routes() {
        let apiRoot = this.apiRoot();

        this.app.use(`/${apiRoot}/sessions`, new SessionRouter(this.dbClient).router);
        this.app.use(`/${apiRoot}/users`, new UserRouter(this.dbClient).router);
        this.app.use(`/${apiRoot}/images`, new ImageRouter(this.dbClient).router);
    }

    // Connect to database and start listening to port
    start() {
        this.app.listen(this.port, () => {
            console.log('We are live on ' + this.port);
        });
    }

}
