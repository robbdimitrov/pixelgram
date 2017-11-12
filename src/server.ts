import * as express from "express";
import * as bodyParser from 'body-parser';
import * as jwt from 'jsonwebtoken';
import { Router, Request, Response, NextFunction } from 'express';

import * as config from '../config/server.config';
import { DBClient } from './data/db-client';
import { ImageRouter } from './routes/image-router';
import { SessionRouter } from './routes/session-router';
import { UserRouter } from './routes/user-router';

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
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));
        this.routes();
    }

    private apiRoot(): string {
        return `${this.apiRootPath}/v${this.apiVersion.toFixed(1)}`;
    }

    private authChecker(req, res, next) {
        if (req.path.indexOf('sessions') !== -1 ||
        (req.method === 'POST' && req.path.indexOf('users') !== -1)) {
            return next();
        }

        var token = req.body.token || req.query.token || req.headers['x-access-token'];

        // decode token
        if (token) {

            // verifies secret and checks exp
            jwt.verify(token, config.secret, (err, decoded) => {
                if (err) {
                    return res.status(403).send({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    // if everything is good, save to request for use in other routes
                    req.user = decoded;
                    next();
                }
            });

        } else {

            // if there is no token
            // return an error
            return res.status(403).send({
                success: false,
                message: 'No token provided.'
            });

        }
    }

    // Configure API endpoints
    private routes() {
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
