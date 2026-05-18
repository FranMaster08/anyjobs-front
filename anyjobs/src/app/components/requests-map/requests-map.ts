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

import * as L from 'leaflet';

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
  const href = `/solicitudes/${encodeURIComponent(marker.openRequestId!)}`;
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

@Component({
  selector: 'app-requests-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './requests-map.html',
  styleUrl: './requests-map.scss',
})
export class RequestsMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  @Input() center: { lat: number; lng: number } | null = null;
  @Input() markers: readonly RequestsMapMarker[] = [];
  @Input() zoom = 13;

  @ViewChild('mapEl', { static: true }) private readonly mapEl!: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private layerGroup: L.LayerGroup | null = null;

  ngAfterViewInit(): void {
    if (this.center) this.ensureMap();
    this.observeMapVisibility();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['center'] && this.center) {
      this.ensureMap();
      this.map?.setView([this.center.lat, this.center.lng], this.zoom, { animate: false });
    }

    if (changes['markers']) {
      this.renderMarkers();
    }
  }

  ngOnDestroy(): void {
    try {
      this.map?.remove();
    } finally {
      this.map = null;
      this.layerGroup = null;
    }
  }

  private ensureMap(): void {
    if (this.map || !this.center) return;

    const el = this.mapEl.nativeElement;
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

    setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {
        // noop
      }
    }, 0);

    this.destroyRef.onDestroy(() => map.remove());

    this.renderMarkers();
  }

  /** Leaflet suele quedar en gris si el contenedor estaba oculto al montar (p. ej. primera visita). */
  private observeMapVisibility(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    const el = this.mapEl.nativeElement;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        try {
          this.map?.invalidateSize();
        } catch {
          // noop
        }
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
        circle.bindPopup(requestPopupHtml(m), { maxWidth: 280 });
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
