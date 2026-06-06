import {Component, Input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgClass} from '@angular/common';
import {
  LucideCamera,
  LucideHeart,
  LucideTriangleAlert,
  LucideSquarePlus
} from '@lucide/angular';

type EmptyStateIcon = 'camera' | 'heart' | 'square-plus' | 'triangle-alert';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  standalone: true,
  imports: [RouterLink, NgClass, LucideCamera, LucideHeart, LucideTriangleAlert, LucideSquarePlus]
})
export class EmptyStateComponent {
  @Input() icon: EmptyStateIcon = 'camera';
  @Input() title = '';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() actionRoute: string | any[] = '';
  @Input() actionStyle: 'primary' | 'outline' = 'primary';
}
