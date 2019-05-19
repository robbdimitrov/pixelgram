import { Component } from "@angular/core";

import { APIClient } from "../../../services/api-client.service";

@Component({
    template: ""
})
export class FormComponent {

    passwordFieldType = "password";
    showButtonTitle = "Show";

    constructor(protected apiClient: APIClient) {}

    onSubmit() {
        // Implemented in subclasses
    }

    onVisibilityToggle() {
        if (this.passwordFieldType === "password") {
            this.passwordFieldType = "text";
            this.showButtonTitle = "Hide";
        } else {
            this.passwordFieldType = "password";
            this.showButtonTitle = "Show";
        }
    }

}
