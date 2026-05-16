import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'app-upload-design-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="pm-page">
      <div class="pm-panel" style="max-width:620px; margin:2.5rem auto; padding:2rem;">
        <p class="pm-kicker mb-1">Personal printing</p>
        <h1 class="pm-heading" style="font-size:1.6rem; font-weight:800; color:var(--pm-text);">
          Upload your own design
        </h1>
        <p style="font-size:var(--pm-text-sm); color:var(--pm-text-muted); margin-top:0.5rem; line-height:1.6;">
          Upload your own artwork (PNG/SVG with a transparent background works best).
          Your upload is private — it stays out of the marketplace and is fully
          customizable on the product of your choice.
        </p>

        <div style="display:grid; gap:1.125rem; margin-top:1.5rem;">
          <label class="pm-field">
            <span class="pm-label">Design name</span>
            <input class="pm-input" type="text" [ngModel]="title()" (ngModelChange)="title.set($event)" placeholder="My custom design" />
          </label>

          <label class="pm-field">
            <span class="pm-label">Artwork file</span>
            <input class="pm-input" type="file" accept="image/*" (change)="onFileChange($event)" style="padding:0.375rem;" />
          </label>

          @if (image()) {
            <img [src]="image()" alt="Preview" style="width:8rem; height:8rem; object-fit:cover; border-radius:var(--pm-radius); border:1px solid var(--pm-border);" />
          }

          @if (error()) {
            <div style="background:var(--pm-danger-soft); border:1px solid rgba(185,28,28,0.2); border-radius:var(--pm-radius); padding:0.75rem 1rem; font-size:var(--pm-text-sm); color:var(--pm-danger);">
              {{ error() }}
            </div>
          }

          <div style="display:flex; gap:0.75rem; border-top:1px solid var(--pm-border); padding-top:1.125rem;">
            <a class="pm-btn pm-btn-secondary" routerLink="/marketplace">← Cancel</a>
            <button type="button" class="pm-btn pm-btn-primary" style="flex:1; justify-content:center;" (click)="continueToCustomize()">
              Continue to customization →
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UploadDesignPageComponent {
  private readonly workflow = inject(WorkflowService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly title = signal('');
  readonly image = signal('');
  readonly error = signal('');

  async onFileChange(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.image.set(await readFileAsDataUrl(file));
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
    const design = this.workflow.createUploadedDesign(user.id, {
      title: this.title().trim() || 'My uploaded design',
      image: this.image(),
    });
    this.router.navigate(['/customize', design.id]);
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
