import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';

import {NavbarComponent} from './shared/ui/components/navbar.component';
import {ThemeService} from './core/theme.service';

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
