import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';

let nextModalId = 0;

@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class ModalComponent {
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) open = false;
  @Input() title = '';
  @Input() ariaLabel = 'Modal';

  @Output() closed = new EventEmitter<void>();

  protected readonly titleId = `app-modal-title-${++nextModalId}`;
  private previousBodyOverflow: string | null = null;

  ngOnChanges(): void {
    if (this.open) this.lockScroll();
    else this.unlockScroll();
  }

  ngOnDestroy(): void {
    this.unlockScroll();
  }

  protected requestClose(): void {
    this.closed.emit();
  }

  protected onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.requestClose();
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.requestClose();
    }
  }

  private lockScroll(): void {
    try {
      const body = document.body;
      if (this.previousBodyOverflow === null) {
        this.previousBodyOverflow = body.style.overflow || '';
      }
      body.style.overflow = 'hidden';

      // Ensure unlock even if component is destroyed while open.
      this.destroyRef.onDestroy(() => this.unlockScroll());
    } catch {
      // ignore
    }
  }

  private unlockScroll(): void {
    try {
      const body = document.body;
      if (this.previousBodyOverflow !== null) {
        body.style.overflow = this.previousBodyOverflow;
        this.previousBodyOverflow = null;
      }
    } catch {
      // ignore
    }
  }
}

