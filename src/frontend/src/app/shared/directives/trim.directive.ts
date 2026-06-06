/* eslint-disable @angular-eslint/directive-selector */
import { Directive, HostListener, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: 'input[type=text], input[type=email], textarea, input:not([type])',
  standalone: true
})
export class TrimDirective {
  constructor(@Optional() @Self() private ngControl: NgControl) {}

  @HostListener('blur', ['$event.target'])
  onBlur(target: any): void {
    if (!target) return;
    const value = target.value;
    if (this.ngControl && typeof value === 'string') {
      const trimmedValue = value.trim();
      if (trimmedValue !== value) {
        this.ngControl.control?.setValue(trimmedValue);
      }
    }
  }
}
