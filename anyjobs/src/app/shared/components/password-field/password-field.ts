import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';

import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-password-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './password-field.html',
  styleUrl: './password-field.scss',
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true }),
    },
  ],
})
export class PasswordFieldComponent {
  private readonly i18n = inject(I18nService);

  readonly inputId = input.required<string>();
  readonly controlName = input.required<string>();
  readonly inputClass = input.required<string>();
  readonly autocomplete = input<string | undefined>();
  readonly ariaInvalid = input<boolean | null>(null);

  protected readonly visible = signal(false);

  protected t(key: string): string {
    return this.i18n.t(key);
  }

  protected toggleVisible(): void {
    this.visible.update((value) => !value);
  }
}
