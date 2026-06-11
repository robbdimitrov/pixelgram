import {InjectionToken} from '@angular/core';

export const BACKEND_URL = new InjectionToken<string>('BACKEND_URL', {
  factory: () => 'http://localhost:8080'
});
