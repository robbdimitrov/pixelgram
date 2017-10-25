import * as express             from "express";
import * as bodyParser          from 'body-parser';

import { DBClient }             from './data/db-client';
import { ImageRouter }          from './routes/image-router';
import { SessionRouter }        from './routes/session-router';
import { UserRouter }           from './routes/user-router';

export class Server {

    app: express.Application;

    private routers = {
        "sessions": new SessionRouter(this.dbClient),
        "users": new UserRouter(this.dbClient),
        "images": new ImageRouter(this.dbClient)
    };

    constructor(private port: number, private apiRootPath: string,
        private apiVersion: number, private dbClient: DBClient) {

        this.app = express();
        this.configure();
        this.start();
    }

    // Configure Express middleware
    private configure() {
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.routes();
    }

    private apiRoot(): string {
        return `${this.apiRootPath}/v${this.apiVersion.toFixed(1)}`;
    }

    // Configure API endpoints
    private routes() {
        let apiRoot = this.apiRoot();

        // Create and map express routers
        for (let key in this.routers) {
            let value = this.routers[key];
            this.app.use(`/${apiRoot}/${key}`, value.router);
        }
    }

    // Connect to database and start listening to port
    private start() {
        this.app.listen(this.port, () => {
            console.log('We are live on ' + this.port);
        });
    }

}
