import { Component } from '@angular/core';

import { Session } from '../../../services/session.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  constructor(private session: Session) {}

  userId() {
    return this.session.userId();
  }
}
