import {Directive, ElementRef, inject, input, OnInit} from '@angular/core';

@Directive({
  selector: '[appAvatarStyle]',
  standalone: true
})
export class AvatarStyleDirective implements OnInit {
  appAvatarStyle = input<'sm' | 'md' | 'lg'>('lg');
  
  private el = inject(ElementRef<HTMLElement>);

  ngOnInit() {
    const base = [
      'relative',
      'shrink-0',
      'overflow-hidden',
      'rounded-full',
      'border',
      'border-slate-200',
      'dark:border-white/15'
    ];
    
    let dynamic: string[] = [];
    const size = this.appAvatarStyle();
    
    if (size === 'sm') {
      dynamic = ['h-8', 'w-8', 'mt-0.5', 'transition-colors', 'hover:border-slate-950', 'dark:hover:border-white'];
    } else if (size === 'md') {
      dynamic = ['h-11', 'w-11', 'transition-colors', 'hover:border-slate-950', 'dark:hover:border-white'];
    } else if (size === 'lg') {
      dynamic = ['shadow-md', 'h-24', 'w-24', 'sm:h-28', 'sm:w-28'];
    }
    
    this.el.nativeElement.classList.add(...base, ...dynamic);
  }
}
