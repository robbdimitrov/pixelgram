import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'pg-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent {
  @Input() content = '';

  @Output() toastClose = new EventEmitter();

  onClick() {
    this.toastClose.emit();
  }
}
