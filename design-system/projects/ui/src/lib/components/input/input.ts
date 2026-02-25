import { NgClass } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'aj-input',
  imports: [NgClass],
  templateUrl: './input.html',
  styleUrl: './input.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AjInput),
      multi: true,
    },
  ],
})
export class AjInput implements ControlValueAccessor {
  @Input() type: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' = 'text';
  @Input() placeholder = '';
  @Input() disabled = false;

  protected value = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  protected handleInput(event: Event) {
    const next = (event.target as HTMLInputElement | null)?.value ?? '';
    this.value = next;
    this.onChange(next);
  }

  protected handleBlur() {
    this.onTouched();
  }

  protected get classes(): string[] {
    return [
      'w-full',
      'rounded-[var(--ds-radius-xl)]',
      'bg-bg-page',
      'px-4',
      'py-3',
      'text-text-primary',
      'placeholder:text-neutral-neutral-2/60',
      'border',
      'border-neutral-neutral-2/20',
      'transition-shadow',
      'duration-fast',
      'ease-standard',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-[var(--ds-color-action-primary)]',
      'focus:border-transparent',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
    ];
  }
}
