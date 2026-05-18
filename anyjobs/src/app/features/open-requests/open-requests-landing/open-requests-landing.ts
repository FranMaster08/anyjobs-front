import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  afterNextRender,
  computed,
  inject,
  Injector,
  runInInjectionContext,
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
import { NearbyOpenRequestItem, OpenRequestListItem } from '../open-requests.models';
import { OpenRequestsService } from '../open-requests.service';
import { OpenRequestsAnalyticsService } from '../open-requests-analytics.service';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { SiteConfigService } from '../../../shared/site-config/site-config.service';
import { applyOpenRequestListFilters } from '../open-requests-filter-items';
import { OpenRequestsFiltersUiService } from '../open-requests-filters-ui.service';
import { openRequestsFiltersSortChanged$ } from '../../../shell/header-open-requests-filters-toggle/header-open-requests-filters-toggle';

type NearbyLoadState = 'idle' | 'loading' | 'success' | 'empty' | 'error';

/** Centro por defecto (datos seed / zona de referencia) si no hay GPS. */
const DEFAULT_MAP_AREA = { lat: 41.3874, lng: 2.1686, label: 'Barcelona' } as const;

/** Línea que es solo un UUID. */
const UUID_ONLY_LINE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * El API a veces devuelve `locationLabel` con el id embebido (p. ej. primera línea UUID o prefijo `uuid · ciudad · barrio`).
 * Para la lista «cercana» solo mostramos la zona legible.
 */
function locationLabelZoneOnly(raw: string | undefined | null): string {
  if (raw == null) return '';
  const normalized = String(raw).replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';

  const lines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let text: string;
  if (lines.length >= 2 && UUID_ONLY_LINE.test(lines[0]!)) {
    text = lines.slice(1).join(' ');
  } else {
    text = lines.join(' ');
  }

  text = text
    .replace(/^\s*[·•]\s*/, '')
    .replace(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\s*[·•]\s*|\s{1,4})/i,
      '',
    )
    .trim();

  return text;
}

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
  private readonly analytics = inject(OpenRequestsAnalyticsService);
  private readonly injector = inject(Injector);
  protected readonly site = inject(SiteConfigService);
  protected readonly authVm = inject(AuthSessionService).vm;
  protected readonly filtersUi = inject(OpenRequestsFiltersUiService);

  @ViewChild('locationSection', { static: false })
  private readonly locationSection?: ElementRef<HTMLElement>;

  @ViewChild('listGrid', { static: false })
  private readonly listGrid?: ElementRef<HTMLElement>;

  private readonly listImpressionsSent = new Set<string>();
  private listImpressionObserver: IntersectionObserver | null = null;
  private pendingFallbackMapArea = false;

  protected readonly skeletons = Array.from({ length: 6 });

  protected readonly state = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly items = signal<readonly OpenRequestListItem[]>([]);

  protected readonly visibleItems = computed(() =>
    applyOpenRequestListFilters(this.items(), this.filtersUi.filters()),
  );

  protected readonly featured = computed(() => this.visibleItems()[0] ?? null);
  protected readonly listItems = computed(() => {
    const items = this.visibleItems();
    return items.length > 1 ? items.slice(1) : items;
  });

  protected readonly hasFilterEmptyResults = computed(
    () => this.items().length > 0 && this.visibleItems().length === 0,
  );

  protected readonly page = signal(1);
  protected readonly nextPage = signal<number | null>(null);
  protected readonly hasMore = signal(false);
  protected readonly isLoadingMore = signal(false);
  protected readonly loadMoreError = signal(false);

  protected readonly isMapOpen = signal(false);
  protected readonly isLocating = signal(false);
  protected readonly locationError = signal<string | null>(null);
  protected readonly userLocation = signal<{ lat: number; lng: number } | null>(null);
  /** Centro del mapa y consulta nearby (GPS o fallback). */
  protected readonly mapArea = signal<{ lat: number; lng: number } | null>(null);
  protected readonly usingFallbackArea = signal(false);
  protected readonly userAddressLabel = signal('Tu ubicación actual');
  protected readonly userAddressValue = signal<string>('—');

  protected readonly nearbyItems = signal<readonly NearbyOpenRequestItem[]>([]);
  protected readonly nearbyState = signal<NearbyLoadState>('idle');
  protected readonly nearbyError = signal<string | null>(null);

  protected readonly mapCenter = computed(() => this.mapArea());

  protected readonly mapMarkers = computed<readonly RequestsMapMarker[]>(() => {
    const area = this.mapArea();
    if (!area) return [];

    const markers: RequestsMapMarker[] = [];
    const user = this.userLocation();
    if (user) {
      markers.push({
        id: 'user',
        kind: 'user',
        label: 'Tu ubicación',
        lat: user.lat,
        lng: user.lng,
      });
    }

    const seen = new Set<string>();
    for (const req of this.nearbyItems()) {
      if (seen.has(req.id)) continue;
      seen.add(req.id);
      const zone = locationLabelZoneOnly(req.locationLabel);
      markers.push({
        id: req.id,
        kind: 'request',
        label: zone.length > 0 ? zone : 'Solicitud abierta',
        lat: req.locationLat,
        lng: req.locationLng,
        openRequestId: req.id,
        excerpt: req.excerpt,
        tags: req.tags,
        distanceKm: req.distanceKm,
      });
    }

    return markers;
  });

  protected readonly nearbyWithDistance = computed(() =>
    this.nearbyItems()
      .slice(0, 3)
      .map((item) => ({ item, distanceKm: item.distanceKm })),
  );

  protected readonly trackById = (_: number, item: OpenRequestListItem) => item.id;
  protected readonly trackByMarkerId = (_: number, item: RequestsMapMarker) => item.id;
  protected readonly trackByNearbyId = (_: number, it: { item: OpenRequestListItem }) => it.item.id;

  /** Texto de zona para la lista de solicitudes cercanas (sin UUID embebido en `locationLabel`). */
  protected nearbyZoneLabel(raw: string | undefined): string {
    return locationLabelZoneOnly(raw);
  }

  constructor() {
    this.site.load();
    this.bootstrapMapOnLoad();
    this.loadFirstPage();
    this.destroyRef.onDestroy(() => this.teardownListImpressions());

    openRequestsFiltersSortChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.state() === 'success') {
          this.loadFirstPage();
        }
      });
  }

  protected onCardNavigate(openRequestId: string): void {
    this.analytics.track({
      kind: 'requestCardClick',
      openRequestId,
      route: '/solicitudes',
      listPage: this.page(),
    });
  }

  ngAfterViewInit(): void {
    // Si el GPS aún no respondió, reintentar al llegar a la sección (p. ej. permiso tardío).
    const el = this.locationSection?.nativeElement;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        if (!this.userLocation() && !this.isLocating()) {
          this.requestUserLocation();
        }
        obs.disconnect();
      },
      { root: null, threshold: 0.1 },
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
      .listOpenRequests(this.listQueryParams(targetPage))
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
          this.scheduleListImpressionsAfterRender();
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

  protected retryNearby(): void {
    this.loadNearbyRequests();
  }

  protected retryLocation(): void {
    this.userLocation.set(null);
    this.mapArea.set(null);
    this.nearbyItems.set([]);
    this.nearbyState.set('idle');
    this.usingFallbackArea.set(false);
    this.locationError.set(null);
    this.pendingFallbackMapArea = false;

    const area = { lat: DEFAULT_MAP_AREA.lat, lng: DEFAULT_MAP_AREA.lng };
    this.mapArea.set(area);
    this.usingFallbackArea.set(true);
    this.userAddressValue.set(DEFAULT_MAP_AREA.label);
    this.loadNearbyRequests();
    this.requestUserLocation(true);
  }

  /** Mapa y solicitudes cercanas visibles desde la primera carga (sin esperar scroll). */
  private bootstrapMapOnLoad(): void {
    if (this.mapArea()) return;

    const area = { lat: DEFAULT_MAP_AREA.lat, lng: DEFAULT_MAP_AREA.lng };
    this.mapArea.set(area);
    this.usingFallbackArea.set(true);
    this.userAddressValue.set(DEFAULT_MAP_AREA.label);
    this.loadNearbyRequests();
    this.requestUserLocation();
  }

  private loadNearbyRequests(): void {
    const loc = this.mapArea();
    if (!loc) return;

    this.nearbyState.set('loading');
    this.nearbyError.set(null);

    this.service
      .listNearbyOpenRequests(loc.lat, loc.lng, { limit: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.nearbyItems.set(res.items);
          this.nearbyState.set(res.items.length === 0 ? 'empty' : 'success');
        },
        error: () => {
          this.nearbyItems.set([]);
          this.nearbyState.set('error');
          this.nearbyError.set('No se pudieron cargar las solicitudes cercanas.');
        },
      });
  }

  private requestUserLocation(force = false): void {
    if (!force && this.isLocating()) return;
    if (!force && this.userLocation()) return;

    this.isLocating.set(true);
    this.locationError.set(null);

    if (!('geolocation' in navigator)) {
      this.isLocating.set(false);
      this.locationError.set('Tu navegador no soporta geolocalización. Usamos una zona de referencia.');
      this.ensureMapAreaWithFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const area = { lat, lng };
        this.userLocation.set(area);
        this.mapArea.set(area);
        this.usingFallbackArea.set(false);
        this.userAddressValue.set(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        this.isLocating.set(false);
        this.locationError.set(null);
        this.loadNearbyRequests();
      },
      (err) => {
        this.isLocating.set(false);
        if (err.code === err.PERMISSION_DENIED) {
          this.locationError.set(
            'Permiso denegado. Mostramos solicitudes en una zona de referencia.',
          );
        } else {
          this.locationError.set(
            'No se pudo obtener tu ubicación. Mostramos solicitudes en una zona de referencia.',
          );
        }
        this.ensureMapAreaWithFallback();
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  }

  private ensureMapAreaWithFallback(): void {
    if (this.mapArea()) return;
    this.pendingFallbackMapArea = true;
    this.tryApplyFallbackMapArea();
  }

  private tryApplyFallbackMapArea(): void {
    if (!this.pendingFallbackMapArea || this.mapArea()) return;
    if (this.state() === 'loading') return;
    this.pendingFallbackMapArea = false;
    this.applyFallbackMapArea();
  }

  private applyFallbackMapArea(): void {
    if (this.mapArea()) return;

    const area = this.resolveFallbackMapArea();
    this.usingFallbackArea.set(true);
    this.mapArea.set({ lat: area.lat, lng: area.lng });
    this.userAddressValue.set(area.label);
    this.loadNearbyRequests();
  }

  /** Si el listado trae coords, centra el mapa ahí (solo mientras seguimos en fallback). */
  private refineFallbackMapAreaFromList(): void {
    if (!this.usingFallbackArea() || this.userLocation()) return;

    const better = this.resolveFallbackMapArea();
    const current = this.mapArea();
    if (!current) return;

    const stillDefault =
      Math.abs(current.lat - DEFAULT_MAP_AREA.lat) < 0.0001 &&
      Math.abs(current.lng - DEFAULT_MAP_AREA.lng) < 0.0001;
    if (!stillDefault) return;

    this.mapArea.set({ lat: better.lat, lng: better.lng });
    this.userAddressValue.set(better.label);
    this.loadNearbyRequests();
  }

  private resolveFallbackMapArea(): { lat: number; lng: number; label: string } {
    const withCoords = this.items().filter(
      (i) => i.locationLat != null && i.locationLng != null,
    );
    if (withCoords.length > 0) {
      const lat =
        withCoords.reduce((sum, i) => sum + (i.locationLat as number), 0) / withCoords.length;
      const lng =
        withCoords.reduce((sum, i) => sum + (i.locationLng as number), 0) / withCoords.length;
      const label =
        locationLabelZoneOnly(withCoords[0]?.locationLabel) || DEFAULT_MAP_AREA.label;
      return { lat, lng, label };
    }
    return { ...DEFAULT_MAP_AREA };
  }

  private setupListImpressions(): void {
    const root = this.listGrid?.nativeElement;
    if (!root) return;

    if (!this.listImpressionObserver) {
      this.listImpressionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const id = (entry.target as HTMLElement).dataset['openRequestId'];
            if (!id || this.listImpressionsSent.has(id)) continue;
            this.listImpressionsSent.add(id);
            this.analytics.track({
              kind: 'requestListImpression',
              openRequestId: id,
              route: '/solicitudes',
              listPage: this.page(),
            });
          }
        },
        { root: null, threshold: 0.5 },
      );
    }

    const cards = root.querySelectorAll<HTMLElement>('[data-open-request-id]');
    for (const card of cards) {
      const id = card.dataset['openRequestId'];
      if (!id || this.listImpressionsSent.has(id)) continue;
      this.listImpressionObserver.observe(card);
    }
  }

  private teardownListImpressions(): void {
    this.listImpressionObserver?.disconnect();
    this.listImpressionObserver = null;
  }

  private listQueryParams(page: number) {
    return {
      page,
      pageSize: 12,
      sort: this.filtersUi.sort(),
      anonymousId: this.analytics.anonymousActorId(),
    };
  }

  private loadFirstPage(): void {
    this.state.set('loading');
    this.loadMoreError.set(false);
    this.isLoadingMore.set(false);
    this.page.set(1);
    this.nextPage.set(null);
    this.hasMore.set(false);

    this.service
      .listOpenRequests(this.listQueryParams(1))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.page.set(1);

          const computedNextPage = res.nextPage ?? (res.hasMore ? 2 : null);
          this.nextPage.set(computedNextPage);
          this.hasMore.set(computedNextPage !== null);

          this.state.set('success');
          this.scheduleListImpressionsAfterRender();
          this.refineFallbackMapAreaFromList();
        },
        error: () => {
          this.state.set('error');
          this.ensureMapAreaWithFallback();
        },
      });
  }

  private scheduleListImpressionsAfterRender(): void {
    runInInjectionContext(this.injector, () => {
      afterNextRender(() => this.setupListImpressions());
    });
  }
}
