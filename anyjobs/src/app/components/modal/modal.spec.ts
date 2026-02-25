import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalComponent } from './modal';

@Component({
  standalone: true,
  template: `
    <app-modal [open]="open" title="Test modal" (closed)="closeCount = closeCount + 1">
      <div>Contenido</div>
    </app-modal>
  `,
  imports: [ModalComponent],
})
class HostComponent {
  open = false;
  closeCount = 0;
}

describe('ModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('closes when clicking on overlay', () => {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    fixture.componentInstance.open = true;
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const overlay: HTMLElement | null = fixture.nativeElement.querySelector('.overlay');
    expect(overlay).toBeTruthy();

    overlay?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(host.closeCount).toBe(1);
  });

  it('closes when pressing Escape', () => {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    fixture.componentInstance.open = true;
    fixture.detectChanges();

    const host = fixture.componentInstance;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(host.closeCount).toBe(1);
  });

  it('locks and restores body scroll', () => {
    document.body.style.overflow = 'auto';
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    fixture.componentInstance.open = true;
    fixture.detectChanges();

    expect(document.body.style.overflow).toBe('hidden');

    fixture.destroy();

    expect(document.body.style.overflow).toBe('auto');
  });
});

