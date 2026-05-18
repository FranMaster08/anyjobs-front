import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';

import * as L from 'leaflet';

import {
  navigateToOpenRequestDetail,
  openRequestDetailPath,
} from '../../features/open-requests/open-requests-navigation';

export interface RequestsMapMarker {
  readonly id: string;
  readonly kind: 'user' | 'request';
  readonly label: string;
  readonly lat: number;
  readonly lng: number;
  readonly openRequestId?: string;
  readonly excerpt?: string;
  readonly tags?: readonly string[];
  readonly distanceKm?: number;
}

type LeafletMapInternals = L.Map & { _containerId?: number };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function requestPopupHtml(marker: RequestsMapMarker): string {
  const tags = (marker.tags ?? []).slice(0, 3).join(', ');
  const distance =
    marker.distanceKm != null
      ? `<p class="mapPopupMeta">~${marker.distanceKm.toFixed(1)} km</p>`
      : '';
  const excerpt = marker.excerpt
    ? `<p class="mapPopupExcerpt">${escapeHtml(marker.excerpt)}</p>`
    : '';
  const tagsHtml = tags ? `<p class="mapPopupMeta">${escapeHtml(tags)}</p>` : '';
  const href = openRequestDetailPath(marker.openRequestId!);
  return [
    '<div class="mapPopup">',
    `<p class="mapPopupTitle">${escapeHtml(marker.label)}</p>`,
    excerpt,
    tagsHtml,
    distance,
    `<a class="mapPopupLink" href="${href}">Ver detalle</a>`,
    '</div>',
  ].join('');
}

/** Evita el error de Leaflet al llamar `remove()` dos veces o sobre un contenedor reutilizado. */
function safeRemoveLeafletMap(map: L.Map | null): void {
  if (!map) return;

  try {
    const container = map.getContainer?.();
    if (!container) return;

    const mapId = (map as LeafletMapInternals)._containerId;
    const containerId = (container as HTMLElement & { _leaflet_id?: number })._leaflet_id;
    if (mapId != null && containerId != null && mapId !== containerId) {
      return;
    }

    map.remove();
  } catch {
    // Contenedor ya reutilizado o mapa ya destruido.
  }
}

@Component({
  selector: 'app-requests-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './requests-map.html',
  styleUrl: './requests-map.scss',
})
export class RequestsMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  @Input() center: { lat: number; lng: number } | null = null;
  @Input() markers: readonly RequestsMapMarker[] = [];
  @Input() zoom = 13;

  @ViewChild('mapEl', { static: true }) private readonly mapEl!: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private layerGroup: L.LayerGroup | null = null;
  private invalidateSizeHandle: ReturnType<typeof setTimeout> | null = null;

  ngAfterViewInit(): void {
    if (this.center) this.ensureMap();
    this.observeMapVisibility();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['center']) {
      if (!this.center) {
        this.destroyMap();
        return;
      }
      this.ensureMap();
      this.map?.setView([this.center.lat, this.center.lng], this.zoom, { animate: false });
    }

    if (changes['markers']) {
      this.renderMarkers();
    }
  }

  ngOnDestroy(): void {
    this.clearInvalidateSizeSchedule();
    this.destroyMap();
  }

  private destroyMap(): void {
    this.clearInvalidateSizeSchedule();
    const map = this.map;
    this.map = null;
    this.layerGroup = null;
    safeRemoveLeafletMap(map);
  }

  private clearInvalidateSizeSchedule(): void {
    if (this.invalidateSizeHandle !== null) {
      clearTimeout(this.invalidateSizeHandle);
      this.invalidateSizeHandle = null;
    }
  }

  private scheduleInvalidateSize(): void {
    this.clearInvalidateSizeSchedule();
    this.invalidateSizeHandle = setTimeout(() => {
      this.invalidateSizeHandle = null;
      if (!this.map) return;
      try {
        this.map.invalidateSize();
      } catch {
        // Mapa destruido o contenedor reutilizado.
      }
    }, 0);
  }

  private ensureMap(): void {
    if (!this.center) return;

    if (this.map) {
      this.renderMarkers();
      return;
    }

    const el = this.mapEl.nativeElement;
    const staleId = (el as HTMLElement & { _leaflet_id?: number })._leaflet_id;
    if (staleId != null) {
      el.querySelectorAll('.leaflet-container, .leaflet-pane').forEach((node) => node.remove());
      delete (el as HTMLElement & { _leaflet_id?: number })._leaflet_id;
    }

    const map = L.map(el, {
      zoomControl: true,
      attributionControl: true,
    }).setView([this.center.lat, this.center.lng], this.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    this.layerGroup = L.layerGroup().addTo(map);
    this.map = map;

    this.scheduleInvalidateSize();
    this.renderMarkers();
  }

  /** Leaflet suele quedar en gris si el contenedor estaba oculto al montar (p. ej. primera visita). */
  private observeMapVisibility(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    const el = this.mapEl.nativeElement;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        this.scheduleInvalidateSize();
      },
      { threshold: 0.05 },
    );

    obs.observe(el);
    this.destroyRef.onDestroy(() => obs.disconnect());
  }

  private renderMarkers(): void {
    if (!this.map || !this.layerGroup) return;
    this.layerGroup.clearLayers();

    for (const m of this.markers) {
      const isUser = m.kind === 'user';
      const circle = L.circleMarker([m.lat, m.lng], {
        radius: isUser ? 9 : 8,
        color: '#ffffff',
        weight: 3,
        fillColor: isUser ? '#111827' : '#0ea5a4',
        fillOpacity: 1,
      });

      if (isUser) {
        circle.bindTooltip(m.label, {
          direction: 'top',
          opacity: 0.95,
          offset: L.point(0, -10),
        });
      } else if (m.openRequestId) {
        const requestId = m.openRequestId;
        circle.bindPopup(requestPopupHtml(m), { maxWidth: 280 });
        circle.on('click', () => {
          void navigateToOpenRequestDetail(this.router, requestId);
        });
        circle.on('popupopen', () => {
          const popupEl = circle.getPopup()?.getElement();
          const link = popupEl?.querySelector<HTMLAnchorElement>('.mapPopupLink');
          if (!link) return;
          link.addEventListener(
            'click',
            (ev) => {
              ev.preventDefault();
              void navigateToOpenRequestDetail(this.router, requestId);
            },
            { once: true },
          );
        });
      } else {
        circle.bindTooltip(m.label, {
          direction: 'top',
          opacity: 0.95,
          offset: L.point(0, -10),
        });
      }

      circle.addTo(this.layerGroup);
    }
  }
}
