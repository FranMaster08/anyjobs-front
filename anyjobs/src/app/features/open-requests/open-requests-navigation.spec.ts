import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import {
  isOpenRequestDetailPath,
  isOpenRequestsLandingPath,
  navigateToOpenRequestDetail,
  openRequestDetailPath,
  openRequestDetailTree,
  pathOnlyFromUrl,
} from './open-requests-navigation';

describe('open-requests-navigation', () => {
  it('detects landing path', () => {
    expect(isOpenRequestsLandingPath('/solicitudes')).toBe(true);
    expect(isOpenRequestsLandingPath('/solicitudes/')).toBe(true);
    expect(isOpenRequestsLandingPath('/solicitudes#solicitudes')).toBe(true);
    expect(isOpenRequestsLandingPath('/solicitudes/abc')).toBe(false);
  });

  it('detects detail path', () => {
    expect(isOpenRequestDetailPath('/solicitudes/00000000-0000-0000-0000-000000000103')).toBe(
      true,
    );
    expect(isOpenRequestDetailPath('/solicitudes')).toBe(false);
    expect(isOpenRequestDetailPath('/solicitudes/nueva')).toBe(false);
  });

  it('strips hash from pathOnlyFromUrl', () => {
    expect(pathOnlyFromUrl('/solicitudes#solicitudes')).toBe('/solicitudes');
  });

  it('builds detail path with encoded id', () => {
    expect(openRequestDetailPath('00000000-0000-0000-0000-000000000104')).toBe(
      '/solicitudes/00000000-0000-0000-0000-000000000104',
    );
  });

  it('navigates without fragment and falls back to location.assign', async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();

    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    Object.defineProperty(router, 'url', { value: '/solicitudes#solicitudes', configurable: true });
    const assign = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, assign });

    await navigateToOpenRequestDetail(router, 'req-1');

    expect(openRequestDetailTree(router, 'req-1')?.fragment).toBeNull();
    await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    expect(assign).toHaveBeenCalledWith('/solicitudes/req-1');
  });
});
