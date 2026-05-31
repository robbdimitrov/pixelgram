import {Directive, ElementRef} from '@angular/core';

const INPUT_CLASSES = [
  'input',
  'input-bordered',
  'h-12',
  'min-h-12',
  'w-full',
  'rounded-2xl',
  'border-slate-200',
  'bg-white',
  'px-5',
  'text-base',
  'text-slate-950',
  'placeholder:text-slate-400',
  'focus:border-slate-950',
  'dark:border-white/10',
  'dark:bg-slate-900',
  'dark:text-white',
  'dark:placeholder:text-slate-500',
  'dark:focus:border-white'
];

const TEXTAREA_CLASSES = [
  'textarea',
  'textarea-bordered',
  'w-full',
  'resize-none',
  'rounded-2xl',
  'border-slate-200',
  'bg-white',
  'px-4',
  'py-3',
  'text-sm',
  'text-slate-950',
  'placeholder:text-slate-400',
  'focus:border-slate-950',
  'dark:border-white/10',
  'dark:bg-slate-900',
  'dark:text-white',
  'dark:placeholder:text-slate-500',
  'dark:focus:border-white'
];

const PRIMARY_ACTION_CLASSES = [
  'btn',
  'h-12',
  'min-h-12',
  'rounded-full',
  'border-0',
  'bg-slate-950',
  'font-bold',
  'text-white',
  'shadow-lg',
  'shadow-slate-900/15',
  'hover:bg-slate-800',
  'disabled:bg-slate-200',
  'disabled:text-slate-400',
  'dark:bg-white',
  'dark:text-slate-950',
  'dark:hover:bg-slate-200',
  'dark:disabled:bg-white/10',
  'dark:disabled:text-slate-600'
];

function addClasses(elementRef: ElementRef<HTMLElement>, classes: string[]) {
  elementRef.nativeElement.classList.add(...classes);
}

@Directive({
  selector: 'input[appFormInput]',
  standalone: false
})
export class FormInputStyleDirective {
  constructor(elementRef: ElementRef<HTMLInputElement>) {
    addClasses(elementRef, INPUT_CLASSES);
  }
}

@Directive({
  selector: 'textarea[appFormTextarea]',
  standalone: false
})
export class FormTextareaStyleDirective {
  constructor(elementRef: ElementRef<HTMLTextAreaElement>) {
    addClasses(elementRef, TEXTAREA_CLASSES);
  }
}

@Directive({
  selector: 'button[appPrimaryAction], a[appPrimaryAction]',
  standalone: false
})
export class PrimaryActionStyleDirective {
  constructor(elementRef: ElementRef<HTMLElement>) {
    addClasses(elementRef, PRIMARY_ACTION_CLASSES);
  }
}
