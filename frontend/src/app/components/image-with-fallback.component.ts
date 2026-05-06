import { Component, computed, effect, input, signal } from '@angular/core';

@Component({
  selector: 'app-image-with-fallback',
  standalone: true,
  template: `
    <img
      [src]="resolvedSrc()"
      [alt]="alt()"
      [class]="imgClass()"
      loading="lazy"
      (error)="handleError()"
    />
  `,
})
export class ImageWithFallbackComponent {
  readonly src = input.required<string>();
  readonly alt = input('Image');
  readonly imgClass = input('');
  readonly fallbackSrc = input('/placeholder-image.svg');

  private readonly failed = signal(false);

  readonly resolvedSrc = computed(() => (this.failed() ? this.fallbackSrc() : this.src()));

  constructor() {
    effect(() => {
      this.src();
      this.failed.set(false);
    });
  }

  handleError(): void {
    this.failed.set(true);
  }
}
