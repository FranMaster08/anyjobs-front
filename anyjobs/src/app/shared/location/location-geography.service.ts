import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';

import { AuthApi } from '../api/auth.api';
import {
  buildLocationCatalogResponse,
  getDivisionsForCountry,
  getMunicipalitiesForDivision,
  getNeighborhoodsForMunicipality,
  municipalityCatalogKey,
  type LocationCatalog,
} from './location-geography.data';
import type { SupportedCountryCode } from './location-geography.types';

export type { LocationCatalog };

@Injectable({ providedIn: 'root' })
export class LocationGeographyService {
  private readonly authApi = inject(AuthApi);
  private readonly catalog = signal<LocationCatalog | null>(null);
  private readonly divisionsByCountry = signal<Record<string, readonly string[]>>({});
  private readonly municipalitiesByDivision = signal<Record<string, readonly string[]>>({});

  readonly catalogLoaded = this.catalog.asReadonly();
  readonly divisionsLoaded = this.divisionsByCountry.asReadonly();
  readonly municipalitiesLoaded = this.municipalitiesByDivision.asReadonly();

  private divisionCacheKey(countryCode: string, division: string): string {
    return `${countryCode.trim().toUpperCase()}::${division.trim()}`;
  }

  ensureCatalog(): Observable<LocationCatalog> {
    const cached = this.catalog();
    if (cached) return of(cached);

    return this.authApi.getLocationCatalog().pipe(
      tap((data) => {
        this.catalog.set(data);
        this.divisionsByCountry.set({
          CO: data.CO?.divisions ?? [],
          AR: data.AR?.divisions ?? [],
        });
        const municipalities: Record<string, readonly string[]> = {};
        for (const code of ['CO', 'AR'] as SupportedCountryCode[]) {
          for (const [division, list] of Object.entries(data[code]?.municipalitiesByDivision ?? {})) {
            municipalities[this.divisionCacheKey(code, division)] = list;
          }
        }
        this.municipalitiesByDivision.set(municipalities);
      }),
    );
  }

  loadDivisionsForCountry(countryCode: string): Observable<readonly string[]> {
    const code = countryCode.trim().toUpperCase();
    const cached = this.divisionsByCountry()[code];
    if (cached?.length) return of(cached);

    return this.authApi.getDivisionsByCountry(code).pipe(
      map((res) => res.divisions),
      tap((divisions) => {
        this.divisionsByCountry.update((prev) => ({ ...prev, [code]: divisions }));
      }),
    );
  }

  loadMunicipalitiesForDivision(countryCode: string, division: string): Observable<readonly string[]> {
    const key = this.divisionCacheKey(countryCode, division);
    const cached = this.municipalitiesByDivision()[key];
    if (cached?.length) return of(cached);

    return this.authApi.getMunicipalitiesByDivision(countryCode, division).pipe(
      map((res) => res.municipalities),
      tap((municipalities) => {
        this.municipalitiesByDivision.update((prev) => ({ ...prev, [key]: municipalities }));
      }),
    );
  }

  getCatalogSnapshot(): LocationCatalog {
    return this.catalog() ?? buildLocationCatalogResponse();
  }

  divisions(countryCode: string): readonly string[] {
    const code = countryCode.trim().toUpperCase();
    return this.divisionsByCountry()[code] ?? getDivisionsForCountry(code);
  }

  municipalities(countryCode: string, division: string): readonly string[] {
    const key = this.divisionCacheKey(countryCode, division);
    const cached = this.municipalitiesByDivision()[key];
    if (cached?.length) return cached;
    return getMunicipalitiesForDivision(countryCode, division);
  }

  neighborhoods(countryCode: string, division: string, municipality: string): readonly string[] {
    const catalog = this.getCatalogSnapshot();
    const code = countryCode.trim().toUpperCase() as SupportedCountryCode;
    const fromCatalog =
      catalog[code]?.neighborhoodsByMunicipalityKey[municipalityCatalogKey(division, municipality)];
    if (fromCatalog?.length) return fromCatalog;
    return getNeighborhoodsForMunicipality(countryCode, division, municipality);
  }
}
