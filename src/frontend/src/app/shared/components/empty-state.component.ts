import {Component, Input} from '@angular/core';

type EmptyStateIcon = 'camera' | 'heart' | 'square-plus' | 'triangle-alert';

@Component({
    selector: 'app-empty-state',
    templateUrl: './empty-state.component.html',
    standalone: false
})
export class EmptyStateComponent {
  @Input() icon: EmptyStateIcon = 'camera';
  @Input() title = '';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() actionRoute: string | any[] = '';
  @Input() actionStyle: 'primary' | 'outline' = 'primary';
}
