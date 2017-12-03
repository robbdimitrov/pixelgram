import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Router, Request, Response, NextFunction } from 'express';
import * as helmet from 'helmet';
import * as cors from 'cors';

import * as config from '../config/server.config';
import { DBClient } from './data/db-client';
import { ImageRouter } from './routes/image-router';
import { SessionRouter } from './routes/session-router';
import { UserRouter } from './routes/user-router';
import { UploadRouter } from './routes/upload-router';
import { AuthService } from './services/auth-service';
import { ImageService } from './services/image-service';
import { UserService } from './services/user-service';

export class Server {

    app: express.Application;

    private routers = {};
    private imageService: ImageService;
    private userService: UserService;

    constructor(private port: number, private apiRootPath: string,
        private apiVersion: number, private dbClient: DBClient) {

        this.app = express();
        this.imageService = new ImageService(dbClient);
        this.userService = new UserService(dbClient);
        this.configure();
        this.start();
    }

    // Configure Express middleware
    private configure() {
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));
        this.configureCORS();
        this.app.use(helmet());
        this.configureRoutes()
        this.connectRoutes();

        this.app.use(`/${this.apiRoot()}/uploads`, express.static(config.imageDir));
    }

    private apiRoot(): string {
        return `${this.apiRootPath}/v${this.apiVersion.toFixed(1)}`;
    }

    private authChecker(req, res, next) {
        // If this is a login request or create a user request,
        // don't check for token
        if (req.method === 'POST' &&
        (req.path.indexOf('/sessions') !== -1 ||
        req.path.indexOf('/users') !== -1)) {
            return next();
        }

        var token = req.body.token || req.query.token || req.headers['x-access-token'];

        // decode token
        if (token) {
            // verifies secret and checks exp
            AuthService.getInstance().validateToken(token).then((result) => {
                req.user = result;
                next();
            }).catch((error) => {
                return res.status(401).send({
                    error: 'Failed to authenticate token.'
                });
            });
        } else {
            // if there is no token
            // return an error
            return res.status(401).send({
                error: 'No token provided.'
            });
        }
    }

    // Configure and enable CORS
    private configureCORS() {
        var whitelist = [config.clientURL]
        var options = {
          origin: function (origin, callback) {
            if (whitelist.indexOf(origin) !== -1) {
              callback(null, true)
            } else {
              callback(new Error('Not allowed by CORS'))
            }
          }
        };
        this.app.options('*', cors(options));
        this.app.use(cors(options));
    }

    // Create API routers
    private configureRoutes() {
        let sessionRouter = new SessionRouter(this.dbClient);
        this.routers['sessions'] = sessionRouter;

        let userRouter = new UserRouter(this.dbClient, this.userService, this.imageService);
        this.routers['users'] = userRouter;

        let imageRouter = new ImageRouter(this.dbClient, this.imageService);
        this.routers['images'] = imageRouter;

        let uploadRouter = new UploadRouter();
        this.routers['upload'] = uploadRouter;
    }

    // Configure API endpoints
    private connectRoutes() {
        let apiRoot = this.apiRoot();

        this.app.use((req, res, next) => {
            this.authChecker(req, res, next);
        });

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
