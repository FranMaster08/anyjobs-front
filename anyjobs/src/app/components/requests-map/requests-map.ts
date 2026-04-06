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
    // Initialize only if we already have a center.
    if (this.center) this.ensureMap();
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

    // Cuando el mapa se monta dentro de un modal, Leaflet puede necesitar recalcular tamaños.
    setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {
        // noop
      }
    }, 0);

    // Cleanup
    this.destroyRef.onDestroy(() => map.remove());

    this.renderMarkers();
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

      circle.addTo(this.layerGroup).bindTooltip(m.label, {
        direction: 'top',
        opacity: 0.95,
        offset: L.point(0, -10),
      });
    }
  }
}

