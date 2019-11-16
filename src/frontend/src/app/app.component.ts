import { Component } from '@angular/core';

import { ErrorService } from './services/error.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(private errorService: ErrorService) {}

  error() {
    return this.errorService.error;
  }

  onToastClose() {
    this.errorService.error = undefined;
  }
}
