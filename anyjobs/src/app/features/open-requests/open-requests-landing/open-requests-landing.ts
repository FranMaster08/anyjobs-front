import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ModalComponent } from '../../../components/modal/modal';
import { OpenRequestCardComponent } from '../../../components/open-request-card/open-request-card';
import {
  RequestsMapComponent,
  RequestsMapMarker,
} from '../../../components/requests-map/requests-map';
import { OpenRequestListItem } from '../open-requests.models';
import { OpenRequestsService } from '../open-requests.service';
import { SiteConfigService } from '../../../shared/site-config/site-config.service';

// Offsets (en grados) para simular solicitudes cercanas (radio ~0.3–1.2 km).
const REQUEST_MARKER_OFFSETS: readonly { lat: number; lng: number }[] = [
  { lat: 0.004, lng: 0.003 },
  { lat: -0.003, lng: 0.004 },
  { lat: 0.002, lng: -0.004 },
  { lat: -0.004, lng: -0.002 },
  { lat: 0.006, lng: 0.0 },
  { lat: 0.0, lng: 0.006 },
  { lat: -0.006, lng: 0.0 },
  { lat: 0.0, lng: -0.006 },
];

function approxDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = (b.lat - a.lat) * 111; // km per lat degree
  const meanLatRad = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  const kmPerLng = 111 * Math.cos(meanLatRad);
  const dLng = (b.lng - a.lng) * kmPerLng;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

interface PreviewPin {
  readonly id: string;
  readonly kind: 'user' | 'request';
  readonly label: string;
  readonly x: number; // percent
  readonly y: number; // percent
}

const PREVIEW_PIN_POSITIONS: readonly Pick<PreviewPin, 'x' | 'y'>[] = [
  { x: 24, y: 62 }, // user
  { x: 64, y: 32 },
  { x: 78, y: 55 },
  { x: 52, y: 74 },
  { x: 36, y: 44 },
];

/**
 * Pantalla (route-level) para descubrir solicitudes de trabajo abiertas.
 * Responsabilidad: orquestar carga/estados y renderizar el listado de cards.
 * No hace: lógica de API fuera del data-access ni define reglas de negocio.
 */
@Component({
  selector: 'app-open-requests-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    OpenRequestCardComponent,
    ModalComponent,
    RequestsMapComponent,
  ],
  templateUrl: './open-requests-landing.html',
  styleUrl: './open-requests-landing.scss',
})
export class OpenRequestsLanding implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly service = inject(OpenRequestsService);
  protected readonly site = inject(SiteConfigService);

  @ViewChild('locationSection', { static: false })
  private readonly locationSection?: ElementRef<HTMLElement>;

  protected readonly skeletons = Array.from({ length: 6 });

  protected readonly state = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly items = signal<readonly OpenRequestListItem[]>([]);

  protected readonly featured = computed(() => this.items()[0] ?? null);
  protected readonly listItems = computed(() => {
    const items = this.items();
    return items.length > 1 ? items.slice(1) : items;
  });

  protected readonly nearbyPreview = computed(() => this.items().slice(0, 3));

  protected readonly page = signal(1);
  protected readonly nextPage = signal<number | null>(null);
  protected readonly hasMore = signal(false);
  protected readonly isLoadingMore = signal(false);
  protected readonly loadMoreError = signal(false);

  protected readonly isMapOpen = signal(false);
  protected readonly isLocating = signal(false);
  protected readonly locationError = signal<string | null>(null);
  protected readonly userLocation = signal<{ lat: number; lng: number } | null>(null);
  protected readonly userAddressLabel = signal('Tu ubicación actual');
  protected readonly userAddressValue = signal<string>('—');

  protected readonly mapMarkers = computed<readonly RequestsMapMarker[]>(() => {
    const loc = this.userLocation();
    if (!loc) return [];

    const markers: RequestsMapMarker[] = [
      {
        id: 'user',
        kind: 'user',
        label: 'Tu ubicación',
        lat: loc.lat,
        lng: loc.lng,
      },
    ];

    const requests = this.items().slice(0, REQUEST_MARKER_OFFSETS.length);
    for (let i = 0; i < requests.length; i++) {
      const req = requests[i]!;
      const off = REQUEST_MARKER_OFFSETS[i]!;
      const label = req.locationLabel ? `${req.id} · ${req.locationLabel}` : req.id;
      markers.push({
        id: req.id,
        kind: 'request',
        label,
        lat: loc.lat + off.lat,
        lng: loc.lng + off.lng,
      });
    }

    // Si aún no hay items (primer render), mostramos algunos markers demo para no dejar el mapa vacío.
    if (requests.length === 0) {
      for (let i = 0; i < Math.min(4, REQUEST_MARKER_OFFSETS.length); i++) {
        const off = REQUEST_MARKER_OFFSETS[i]!;
        markers.push({
          id: `demo-${i + 1}`,
          kind: 'request',
          label: `Solicitud cercana ${i + 1}`,
          lat: loc.lat + off.lat,
          lng: loc.lng + off.lng,
        });
      }
    }

    return markers;
  });

  protected readonly nearbyWithDistance = computed(() => {
    const loc = this.userLocation();
    const items = this.items().slice(0, 3);

    if (!loc) {
      return items.map((it) => ({ item: it, distanceKm: null as number | null }));
    }

    return items.map((it, idx) => {
      const off = REQUEST_MARKER_OFFSETS[idx] ?? { lat: 0.004, lng: 0.004 };
      const markerPos = { lat: loc.lat + off.lat, lng: loc.lng + off.lng };
      const distanceKm = approxDistanceKm(loc, markerPos);
      return { item: it, distanceKm };
    });
  });

  protected readonly previewPins = computed<readonly PreviewPin[]>(() => {
    const pins: PreviewPin[] = [];
    const userPos = PREVIEW_PIN_POSITIONS[0]!;
    pins.push({
      id: 'user',
      kind: 'user',
      label: 'Tu zona',
      x: userPos.x,
      y: userPos.y,
    });

    const reqs = this.items().slice(0, PREVIEW_PIN_POSITIONS.length - 1);
    for (let i = 0; i < reqs.length; i++) {
      const pos = PREVIEW_PIN_POSITIONS[i + 1]!;
      pins.push({
        id: reqs[i]!.id,
        kind: 'request',
        label: reqs[i]!.id,
        x: pos.x,
        y: pos.y,
      });
    }

    return pins;
  });

  protected readonly trackById = (_: number, item: OpenRequestListItem) => item.id;
  protected readonly trackByMarkerId = (_: number, item: RequestsMapMarker) => item.id;
  protected readonly trackByPreviewPinId = (_: number, item: PreviewPin) => item.id;
  protected readonly trackByNearbyId = (_: number, it: { item: OpenRequestListItem }) => it.item.id;

  constructor() {
    this.site.load();
    this.loadFirstPage();
  }

  ngAfterViewInit(): void {
    // Ask for location when the "Ubicación" section becomes visible,
    // so the preview can show "near you" examples without prompting on first paint.
    const el = this.locationSection?.nativeElement;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') return;

    const obs = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((e) => e.isIntersecting);
        if (!isVisible) return;
        this.requestUserLocation();
        obs.disconnect();
      },
      { root: null, threshold: 0.25 },
    );

    obs.observe(el);
    this.destroyRef.onDestroy(() => obs.disconnect());
  }

  protected retry(): void {
    this.loadFirstPage();
  }

  protected loadMore(): void {
    if (this.isLoadingMore()) return;
    if (!this.hasMore()) return;

    const targetPage = this.nextPage() ?? this.page() + 1;
    this.isLoadingMore.set(true);
    this.loadMoreError.set(false);

    this.service
      .listOpenRequests({ page: targetPage, pageSize: 12, sort: 'publishedAtDesc' })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingMore.set(false)),
      )
      .subscribe({
        next: (res) => {
          this.items.update((prev) => [...prev, ...res.items]);
          this.page.set(targetPage);

          const computedNextPage = res.nextPage ?? (res.hasMore ? targetPage + 1 : null);
          this.nextPage.set(computedNextPage);
          this.hasMore.set(computedNextPage !== null);
        },
        error: () => {
          this.loadMoreError.set(true);
        },
      });
  }

  protected openMap(): void {
    this.isMapOpen.set(true);
    this.requestUserLocation();
  }

  protected closeMap(): void {
    this.isMapOpen.set(false);
  }

  private requestUserLocation(): void {
    if (this.userLocation()) return;
    if (this.isLocating()) return;

    this.isLocating.set(true);
    this.locationError.set(null);

    if (!('geolocation' in navigator)) {
      this.isLocating.set(false);
      this.locationError.set('Tu navegador no soporta geolocalización.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.userLocation.set({ lat, lng });
        this.userAddressValue.set(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        this.isLocating.set(false);
      },
      (err) => {
        this.isLocating.set(false);
        if (err.code === err.PERMISSION_DENIED) {
          this.locationError.set('Permiso denegado. Activa la ubicación para ver el mapa.');
        } else {
          this.locationError.set('No se pudo obtener tu ubicación. Intenta de nuevo.');
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }

  private loadFirstPage(): void {
    this.state.set('loading');
    this.loadMoreError.set(false);
    this.isLoadingMore.set(false);
    this.page.set(1);
    this.nextPage.set(null);
    this.hasMore.set(false);

    this.service
      .listOpenRequests({ page: 1, pageSize: 12, sort: 'publishedAtDesc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.page.set(1);

          const computedNextPage = res.nextPage ?? (res.hasMore ? 2 : null);
          this.nextPage.set(computedNextPage);
          this.hasMore.set(computedNextPage !== null);

          this.state.set('success');
        },
        error: () => {
          this.state.set('error');
        },
      });
  }
}
