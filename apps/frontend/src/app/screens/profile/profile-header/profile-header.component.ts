import {Component, inject, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {LucideSettings} from '@lucide/angular';

import {User} from '../../../models/user.model';
import {SessionService} from '../../../services/session.service';
import {ImagePipe} from '../../../shared/pipes/image.pipe';
import {PluralizePipe} from '../../../shared/pipes/pluralize.pipe';

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-header.component.html',
  standalone: true,
  imports: [RouterLink, ImagePipe, PluralizePipe, LucideSettings]
})
export class ProfileHeaderComponent {
  private session = inject(SessionService);

  user = input.required<User>();

  isCurrentUser() {
    return this.session.userId() === this.user().id;
  }
}
