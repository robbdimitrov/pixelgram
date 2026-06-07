import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';

import {NavbarComponent} from './shared/components/navbar.component';
import {ThemeService} from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent]
})
export class AppComponent {
  constructor() {
    inject(ThemeService);
  }
}
