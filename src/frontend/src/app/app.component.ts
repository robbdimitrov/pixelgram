import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

import {NavbarComponent} from './shared/components/navbar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent]
})
export class AppComponent {}
