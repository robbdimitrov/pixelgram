import {Component, Input} from '@angular/core';

import {User} from '../../../models/user.model';
import {SessionService} from '../../../services/session.service';

@Component({
    selector: 'app-profile-header',
    templateUrl: './profile-header.component.html',
    standalone: false
})
export class ProfileHeaderComponent {
  @Input() user: User;

  constructor(private session: SessionService) {}

  isCurrentUser() {
    if (!this.user) {
      return false;
    }
    return this.session.userId() === this.user.id;
  }
}
