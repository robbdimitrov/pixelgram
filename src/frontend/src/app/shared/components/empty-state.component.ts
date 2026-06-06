import {Component, input} from '@angular/core';
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
  icon = input<EmptyStateIcon>('camera');
  title = input('');
  description = input('');
  actionLabel = input('');
  actionRoute = input<string | unknown[]>('');
  actionStyle = input<'primary' | 'outline'>('primary');
}
