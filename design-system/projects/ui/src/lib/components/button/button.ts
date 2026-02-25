import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'aj-button',
  imports: [NgClass],
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class Button {
  @Input() variant: 'default' | 'primary' = 'default';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;

  protected get classes(): string[] {
    const base = [
      'inline-flex',
      'items-center',
      'justify-center',
      'gap-2',
      'select-none',
      'whitespace-nowrap',
      'rounded-[var(--ds-radius-xl)]',
      'px-4',
      'py-2',
      'text-h3',
      'transition-colors',
      'duration-fast',
      'ease-standard',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-[var(--ds-color-action-primary)]',
      'focus-visible:ring-offset-2',
    ];

    const byVariant =
      this.variant === 'primary'
        ? ['bg-action-primary', 'text-bg-page', 'hover:brightness-95']
        : ['bg-transparent', 'text-text-primary', 'hover:bg-neutral-neutral-5'];

    const byState = this.disabled ? ['cursor-not-allowed', 'opacity-50'] : [];
    return [...base, ...byVariant, ...byState];
  }
}
