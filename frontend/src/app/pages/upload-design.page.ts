import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ACCEPTED_ARTWORK_TYPES, readArtworkFile } from '../utils/read-file';
import { AuthService } from '../services/auth.service';
import { PlatformStoreService } from '../services/platform-store.service';

@Component({
  selector: 'app-upload-design-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <section class="page" style="padding-block:38px 28px;">
      <div class="section-head">
        <span class="section-no">XII.</span>
        <hr class="line" />
        <span class="title">Personal printing · your own artwork</span>
      </div>

      <div style="max-width:640px; margin:0 auto; border:1px solid var(--pm-rule-strong); padding:32px;">
        <h1 class="display" style="font-size:clamp(28px, 4vw, 40px); margin:0;">
          Upload your<br /><em>own plate.</em>
        </h1>
        <p class="serif-italic" style="font-size:15px; color:var(--pm-text-muted); margin-top:14px; line-height:1.6;">
          PNG, JPEG, SVG or WebP up to 1 MB — a transparent background works best.
          Your upload stays private: it never enters the marketplace, and you can
          place it on any product you like.
        </p>

        <div style="display:grid; gap:18px; margin-top:28px;">
          <label class="pm-field">
            <span class="pm-label">Design name</span>
            <input class="pm-input" type="text" [ngModel]="title()" (ngModelChange)="title.set($event)" placeholder="My custom design" />
          </label>

          <label class="pm-field">
            <span class="pm-label">Artwork file</span>
            <input class="pm-input" type="file" [attr.accept]="acceptedTypes" (change)="onFileChange($event)" style="padding:6px;" />
          </label>

          @if (image()) {
            <img [src]="image()" alt="Preview of the uploaded artwork" style="width:9rem; height:9rem; object-fit:contain; border:1px solid var(--pm-rule); background:var(--pm-surface-alt);" />
          }

          @if (error()) {
            <div class="serif-italic" style="border:1px solid var(--pm-danger); color:var(--pm-danger); padding:12px 16px;">
              {{ error() }}
            </div>
          }

          <div style="display:flex; gap:12px; border-top:1px solid var(--pm-rule); padding-top:20px;">
            <a class="btn btn-ghost" routerLink="/marketplace">← Cancel</a>
            <button type="button" class="btn btn-clay" style="flex:1; justify-content:center;" (click)="continueToCustomize()">
              Continue to customization <span class="ar">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class UploadDesignPageComponent {
  private readonly store = inject(PlatformStoreService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly title = signal('');
  readonly image = signal('');
  readonly error = signal('');
  /** Mirrors the validation in readArtworkFile so the picker offers the same set. */
  readonly acceptedTypes = ACCEPTED_ARTWORK_TYPES.join(',');

  /** Same type + size rules as the designer upload wizard. */
  async onFileChange(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const { dataUrl, error } = await readArtworkFile(file);
    if (error) {
      this.error.set(error);
      this.image.set('');
      return;
    }
    this.error.set('');
    this.image.set(dataUrl!);
  }

  continueToCustomize(): void {
    const user = this.auth.user();
    if (!user) {
      this.router.navigateByUrl('/login');
      return;
    }
    if (!this.image()) {
      this.error.set('Please choose an artwork file to upload.');
      return;
    }
    const design = this.store.createUploadedDesign(user.id, {
      title: this.title().trim() || 'My uploaded design',
      image: this.image(),
    });
    this.router.navigate(['/customize', design.id]);
  }
}
