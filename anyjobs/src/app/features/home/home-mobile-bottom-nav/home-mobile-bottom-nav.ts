import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { I18nService } from '../../../shared/i18n/i18n.service';
import { buildProfileRouterLink } from '../../../shared/navigation/profile-router-link';

@Component({
  selector: 'app-home-mobile-bottom-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './home-mobile-bottom-nav.html',
  styleUrl: './home-mobile-bottom-nav.scss',
})
export class HomeMobileBottomNavComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthSessionService);
  protected readonly i18n = inject(I18nService);

  protected readonly t = (key: string) => this.i18n.t(key);

  protected readonly authVm = this.auth.vm;

  protected readonly profileLink = computed(() => buildProfileRouterLink(this.authVm().user?.id));

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly jobsActive = computed(() => this.isJobsActive(this.url()));
  protected readonly solicitudesActive = computed(() => this.isSolicitudesSectionActive(this.url()));
  protected readonly mapaActive = computed(() => this.isMapaActive(this.url()));
  protected readonly profileActive = computed(() => this.isProfileActive(this.url()));

  protected openLoginFlow(): void {
    void this.router.navigate(['/home'], {
      queryParams: { login: '1' },
      queryParamsHandling: 'merge',
    });
  }

  private isJobsActive(url: string): boolean {
    const tree = this.router.parseUrl(url);
    const segs = tree.root.children['primary']?.segments ?? [];
    const root = segs[0]?.path;
    return root === 'home' || root === 'reels';
  }

  private isMapaActive(url: string): boolean {
    const tree = this.router.parseUrl(url);
    const segs = tree.root.children['primary']?.segments ?? [];
    if (segs[0]?.path !== 'solicitudes') return false;
    return tree.fragment === 'ubicacion';
  }

  private isSolicitudesSectionActive(url: string): boolean {
    const tree = this.router.parseUrl(url);
    const segs = tree.root.children['primary']?.segments ?? [];
    if (segs[0]?.path !== 'solicitudes') return false;
    const f = tree.fragment;
    if (f === 'ubicacion' || f === 'contacto') return false;
    return true;
  }

  private isProfileActive(url: string): boolean {
    const tree = this.router.parseUrl(url);
    const segs = tree.root.children['primary']?.segments ?? [];
    if (segs[0]?.path === 'perfil') return true;
    if (segs[0]?.path === 'usuarios' && segs.length >= 2) return true;
    return false;
  }
}
