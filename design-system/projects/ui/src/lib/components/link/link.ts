import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'aj-link',
  imports: [NgClass],
  templateUrl: './link.html',
  styleUrl: './link.css',
})
export class Link {
  @Input() href = '#';
  @Input() target: '_self' | '_blank' | '_parent' | '_top' = '_self';
  @Input() rel: string | null = null;

  protected get classes(): string[] {
    return [
      'text-action-primary',
      'underline',
      'underline-offset-2',
      'decoration-transparent',
      'hover:decoration-current',
      'transition-colors',
      'duration-[250ms]',
      'ease-[cubic-bezier(0.2,0,0,1)]',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-[var(--ds-color-action-primary)]',
      'focus-visible:ring-offset-2',
      'rounded-[var(--ds-radius-tiny)]',
    ];
  }
}
