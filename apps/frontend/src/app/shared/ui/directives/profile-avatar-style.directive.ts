import {Directive, ElementRef, inject} from '@angular/core';

const PROFILE_AVATAR_CLASSES = [
  'relative',
  'shrink-0',
  'overflow-hidden',
  'rounded-full',
  'border',
  'border-slate-200',
  'shadow-md',
  'dark:border-white/15',
  'h-24',
  'w-24',
  'sm:h-28',
  'sm:w-28'
];

@Directive({
  selector: '[appProfileAvatarStyle]',
  standalone: true
})
export class ProfileAvatarStyleDirective {
  constructor() {
    inject(ElementRef<HTMLElement>).nativeElement.classList.add(...PROFILE_AVATAR_CLASSES);
  }
}
