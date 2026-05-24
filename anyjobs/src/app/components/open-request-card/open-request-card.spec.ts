import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { OpenRequestCardComponent } from './open-request-card';

describe('OpenRequestCardComponent', () => {
  let fixture: ComponentFixture<OpenRequestCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenRequestCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OpenRequestCardComponent);
  });

  it('should render placeholder when no image', async () => {
    fixture.componentRef.setInput('request', { id: '1', excerpt: 'Hola' });
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('img')).toBeFalsy();
    expect(compiled.querySelector('.media__placeholder')).toBeTruthy();
    expect(compiled.textContent).toContain('Hola');
  });

  it('should render image when imageUrl is present', async () => {
    fixture.componentRef.setInput('request', { id: '1', excerpt: 'Hola', imageUrl: '/img.png' });
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const img = compiled.querySelector('img') as HTMLImageElement | null;
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('/img.png');
  });

  it('should format budget with currency and thousand separators', async () => {
    fixture.componentRef.setInput('request', {
      id: '1',
      excerpt: 'Limpieza',
      budgetLabel: '110000',
      locationLabel: 'Centro · Bogotá · Cundinamarca · Colombia',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.chip--budget')?.textContent?.trim()).toBe('$110.000');
  });
});

