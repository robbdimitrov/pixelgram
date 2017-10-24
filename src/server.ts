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
        this.dbClient = new DBClient();
        this.port = 3000;
        this.apiVersion = 1.0;
        this.apiRootPath = 'api';

        this.configure();
    }

    // Configure Express middleware
    configure() {
        this.app.use(bodyParser.urlencoded({ extended: true }));

        this.routes();
    }

    apiRoot(): string {
        return '/${this.apiRootPath}/${this.apiVersion}';
    }

    // Configure API endpoints
    routes() {
        let apiRoot = this.apiRoot();

        this.app.use('${apiRoot}/session', new SessionRouter(this.dbClient).router);
        this.app.use('${apiRoot}/users', new UserRouter(this.dbClient).router);
        this.app.use('${apiRoot}/images', new ImageRouter(this.dbClient).router);
    }

    // Connect to database and start listening to port
    start() {
        this.dbClient.connect(config.dbURI, () => {
            console.log('Unable to connect to Mongo.');
            process.exit(1);
        }, (error) => {
            this.app.listen(this.port, () => {
                console.log('We are live on ' + this.port);
            });
        });
    }

}
