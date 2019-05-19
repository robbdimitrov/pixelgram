import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription } from "rxjs/Subscription";

import { APIClient, UserDidLogoutNotification } from "../../services/api-client.service";
import { Session } from "../../services/session.service";

@Component({
    selector: "pg-settings",
    templateUrl: "./settings.component.html",
    styleUrls: ["./settings.component.scss"]
})
export class SettingsComponent {

    loginSubscription: Subscription;

    constructor(private apiClient: APIClient, private session: Session,
        private router: Router) {
        this.subscribeToLogout();
    }

    // Subscriptions

    private subscribeToLogout() {
        this.loginSubscription = this.apiClient.loginSubject.subscribe((value) => {
            if (value === UserDidLogoutNotification) {
                this.router.navigate(["/login"]);
            }
        });
    }

    onChangePasswordClick() {
        this.router.navigate(["account/change_password"]);
    }

    onLikedPostsClick() {
        let userId = this.session.userId();
        this.router.navigate([`/user/${userId}/likes`]);
    }

    onLogoutClick() {
        this.apiClient.logoutUser();
    }

}
