/* eslint-disable @angular-eslint/directive-selector */
import {Directive, HostListener, inject, Optional, Self} from '@angular/core';
import {NgControl} from '@angular/forms';

@Directive({
  selector: 'input[type=text], input[type=email], textarea, input:not([type])',
  standalone: true
})
export class TrimDirective {
  private ngControl = inject(NgControl, {optional: true, self: true});

  @HostListener('blur', ['$event.target'])
  onBlur(target: EventTarget | null): void {
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    const value = target.value;
    if (this.ngControl && typeof value === 'string') {
      const trimmedValue = value.trim();
      if (trimmedValue !== value) {
        this.ngControl.control?.setValue(trimmedValue);
      }
    }
  }
}
