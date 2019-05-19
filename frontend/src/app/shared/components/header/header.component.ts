import { Component } from "@angular/core";

import { Session } from "../../../services/session.service";

@Component({
    selector: "pg-header",
    templateUrl: "./header.component.html",
    styleUrls: ["./header.component.scss"]
})
export class HeaderComponent {

    constructor(private session: Session) {}

    isAuthed() {
        return this.session.token() !== null;
    }

    userId() {
        return this.session.userId();
    }

}
