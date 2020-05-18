import { Component } from '@angular/core';

import { Session } from '../../services/session.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  constructor(private session: Session) {}

  userId() {
    return this.session.userId();
  }
}
