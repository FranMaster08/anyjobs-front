import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Bloque identitario (avatar + nombre) navegable al perfil público en `/usuarios/:userId`.
 * El propio usuario sigue la misma ruta; `Profile` resuelve modo privado cuando el id coincide con la sesión.
 */
@Component({
  selector: 'app-user-identity-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-identity-link.html',
  styleUrl: './user-identity-link.scss',
})
export class UserIdentityLinkComponent {
  readonly userId = input.required<string>();
  readonly displayName = input.required<string>();
  readonly subtitle = input<string | undefined>(undefined);
  readonly avatarUrl = input<string | undefined>(undefined);

  protected readonly initialLetter = computed(() => {
    const n = this.displayName().trim();
    return (n[0] ?? 'U').toUpperCase();
  });

  protected readonly ariaLabelText = computed(() => {
    const name = this.displayName().trim() || 'Usuario';
    return `Ver perfil de ${name}`;
  });
}
