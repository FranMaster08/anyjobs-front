import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { OpenRequestListItem } from '../../features/open-requests/open-requests.models';

/**
 * Card para mostrar una solicitud abierta en listados (imagen + extracto + metadatos).
 * Responsabilidad: render de UI y navegación a detalle; no hace fetch ni lógica de negocio.
 */
@Component({
  selector: 'app-open-request-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: './open-request-card.html',
  styleUrl: './open-request-card.scss',
})
export class OpenRequestCardComponent {
  readonly request = input.required<OpenRequestListItem>();

  protected readonly trackByValue = (_: number, v: string) => v;

  protected get detailLink(): (string | number)[] {
    return ['/solicitudes', this.request().id];
  }

  protected get ariaLabel(): string {
    return 'Ver detalle de la solicitud';
  }
}

