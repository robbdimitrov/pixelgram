import { Component, Input, Output, EventEmitter } from '@angular/core';

import { User } from '../../../models/user.model';
import { Session } from '../../../services/session.service';

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-header.component.html',
  styleUrls: ['./profile-header.component.scss']
})
export class ProfileHeaderComponent {
  @Input() user: User;
  @Output() openSettings = new EventEmitter();
  @Output() openEditProfile = new EventEmitter();

  constructor(private session: Session) {}

  isCurrentUser() {
    if (!this.user) {
      return false;
    }
    return this.session.userId() === this.user.id;
  }

  onSettingsClick() {
    this.openSettings.emit();
  }

  onEditProfileClick() {
    this.openEditProfile.emit();
  }
}
