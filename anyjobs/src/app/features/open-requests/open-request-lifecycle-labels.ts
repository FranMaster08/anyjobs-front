export type OpenRequestLifecycleStatus = 'ACTIVE' | 'CANCELLED';

export type OpenRequestLifecycleLabelContext = 'owner' | 'applicant';

export function normalizeLifecycleStatus(
  value: string | undefined | null,
): OpenRequestLifecycleStatus {
  return value === 'CANCELLED' ? 'CANCELLED' : 'ACTIVE';
}

export function openRequestLifecycleLabel(
  status: OpenRequestLifecycleStatus,
  context: OpenRequestLifecycleLabelContext,
): string {
  if (status === 'CANCELLED') {
    return context === 'owner' ? 'Cerrado' : 'Cancelada';
  }
  return context === 'owner' ? 'Activo' : 'Enviada';
}

export function isRequestCancelled(status: OpenRequestLifecycleStatus | undefined): boolean {
  return status === 'CANCELLED';
}
