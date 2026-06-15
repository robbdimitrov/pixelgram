import {Directive, ElementRef, inject} from '@angular/core';

@Directive({
  selector: '[appCardStyle]',
  standalone: true
})
export class CardStyleDirective {
  constructor() {
    inject(ElementRef<HTMLElement>).nativeElement.classList.add(
      'rounded-2xl',
      'border',
      'border-slate-200',
      'bg-white',
      'text-slate-950',
      'dark:border-white/10',
      'dark:bg-slate-950',
      'dark:text-white'
    );
  }
}
