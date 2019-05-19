import { Component } from "@angular/core";

import { ErrorService } from "./services/error.service";

@Component({
  selector: "pg-root",
  templateUrl: "./app.component.html"
})
export class AppComponent {

    constructor(private errorService: ErrorService) {}

    error() {
        return this.errorService.error;
    }

    onCloseToast() {
        this.errorService.error = undefined;
    }

}
