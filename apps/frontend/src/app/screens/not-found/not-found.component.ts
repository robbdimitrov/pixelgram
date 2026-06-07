import {Component} from '@angular/core';

import {EmptyStateComponent} from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  standalone: true,
  imports: [EmptyStateComponent]
})
export class NotFoundComponent {}
