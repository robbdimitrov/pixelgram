import {mergeApplicationConfig, ApplicationConfig} from '@angular/core';
import {provideServerRendering, withRoutes} from '@angular/ssr';

import {appConfig} from './app.config';
import {serverRoutes} from './app.routes.server';
import {BACKEND_URL} from './shared/tokens';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {provide: BACKEND_URL, useFactory: () => process.env['BACKEND_URL'] ?? 'http://backend:8080'}
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
