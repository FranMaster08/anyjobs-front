import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';

import { formatOpenRequestBudgetLabel } from '../../features/open-requests/open-request-budget.utils';
import { OpenRequestListItem } from '../../features/open-requests/open-requests.models';
import {
  navigateToOpenRequestDetail,
  openRequestDetailPath,
} from '../../features/open-requests/open-requests-navigation';

/**
 * Card para mostrar una solicitud abierta en listados (imagen + extracto + metadatos).
 * Responsabilidad: render de UI y navegación a detalle; no hace fetch ni lógica de negocio.
 */
@Component({
  selector: 'app-open-request-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './open-request-card.html',
  styleUrl: './open-request-card.scss',
})
export class OpenRequestCardComponent {
  private readonly router = inject(Router);

  readonly request = input.required<OpenRequestListItem>();
  readonly cardNavigate = output<string>();

  protected readonly ariaLabel = 'Ver detalle de la solicitud';

  protected readonly trackByValue = (_: number, v: string) => v;

  protected formattedBudgetLabel(): string {
    const request = this.request();
    return formatOpenRequestBudgetLabel(request.budgetLabel, request.locationLabel);
  }

  protected detailHref(): string {
    return openRequestDetailPath(this.request().id);
  }

  protected openDetail(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const id = this.request().id?.trim();
    if (!id) return;
    this.cardNavigate.emit(id);
    void navigateToOpenRequestDetail(this.router, id);
  }
}
