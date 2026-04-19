import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { UserPage } from '../../models/models';

@Component({
  selector: 'app-page-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div [style.background]="style().bg" [style.color]="style().text" style="min-height:100vh">
  @if (loading()) {
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#555;font-family:'Space Mono',monospace">
      Cargando página...
    </div>
  }
  @if (error()) {
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:20px">
      <div style="font-size:3rem">🚫</div>
      <p style="color:#555;font-family:'Space Mono',monospace">Página no encontrada.</p>
      <a routerLink="/" style="color:var(--purple);font-family:'Space Mono',monospace">← Volver al inicio</a>
    </div>
  }
  @if (page()) {
    @for (sec of page()!.page_data?.sections || []; track sec.id) {
      @if (sec.type === 'hero') {
        <div [style.min-height]="sec.data.height||'100vh'" [style.text-align]="sec.data.align"
             [style.background-image]="sec.data.bg ? 'url('+sec.data.bg+')' : ''"
             [style.background]="!sec.data.bg ? 'linear-gradient(135deg,'+style().accent+'22,'+style().bg+')' : ''"
             style="display:flex;flex-direction:column;justify-content:center;align-items:center;padding:80px 5%;background-size:cover;background-position:center">
          <h1 [style.color]="style().accent" style="font-family:'Rock Salt',cursive;font-size:clamp(2.5rem,8vw,5rem);margin-bottom:20px">{{ sec.data.title }}</h1>
          <p style="font-size:1.1rem;color:#aaa">{{ sec.data.subtitle }}</p>
        </div>
      }
      @if (sec.type === 'text') {
        <div style="padding:80px 10%" [style.text-align]="sec.data.align">
          <h2 [style.color]="style().accent" style="font-family:'Permanent Marker',cursive;font-size:2.2rem;margin-bottom:24px">{{ sec.data.title }}</h2>
          <p style="line-height:1.9;font-size:.95rem;max-width:700px" [style.margin]="sec.data.align==='center'?'0 auto':''">{{ sec.data.body }}</p>
        </div>
      }
      @if (sec.type === 'image') {
        <div style="padding:60px 10%;text-align:center">
          @if (sec.data.src) { <img [src]="sec.data.src" [alt]="sec.data.alt" style="max-width:100%;border-radius:6px"> }
          @if (sec.data.caption) { <p style="color:#555;font-size:.8rem;margin-top:8px">{{ sec.data.caption }}</p> }
        </div>
      }
      @if (sec.type === 'skills') {
        <div style="padding:80px 10%">
          <h2 [style.color]="style().accent" style="font-family:'Permanent Marker',cursive;font-size:2.2rem;margin-bottom:36px">{{ sec.data.title }}</h2>
          @for (item of sec.data.items; track item) {
            <div style="margin-bottom:20px;max-width:600px">
              <div style="display:flex;justify-content:space-between;font-size:.9rem;margin-bottom:8px">
                <span>{{ item.name }}</span>
                <span [style.color]="style().accent">{{ item.pct }}%</span>
              </div>
              <div style="height:4px;border-radius:2px;background:#1a1a1a">
                <div [style.width]="item.pct+'%'" [style.background]="style().accent" style="height:4px;border-radius:2px"></div>
              </div>
            </div>
          }
        </div>
      }
      @if (sec.type === 'cta') {
        <div style="padding:60px;text-align:center">
          <a [href]="sec.data.link" [style.background]="sec.data.color||style().accent" style="display:inline-block;padding:16px 42px;color:white;text-decoration:none;font-family:'Permanent Marker',cursive;font-size:1.2rem;clip-path:polygon(4% 0%,100% 0%,96% 100%,0% 100%)">
            {{ sec.data.text }}
          </a>
        </div>
      }
      @if (sec.type === 'divider') {
        <div style="margin:0 10%;border-top:1px solid" [style.border-color]="sec.data.color||'#222'"></div>
      }
      @if (sec.type === 'contact') {
        <div style="padding:80px 10%">
          <h2 [style.color]="style().accent" style="font-family:'Permanent Marker',cursive;font-size:2.2rem;margin-bottom:24px">{{ sec.data.title }}</h2>
          @if (sec.data.email) { <p style="color:#888;margin-bottom:16px;font-family:'Space Mono',monospace">📧 {{ sec.data.email }}</p> }
        </div>
      }
    }
    <footer style="padding:32px;text-align:center;border-top:1px solid #1a1a1a;font-family:'Space Mono',monospace;font-size:.72rem;color:#444">
      Creado con <a routerLink="/" [style.color]="style().accent">SAQES Builder</a>
    </footer>
  }
</div>
  `
})
export class PageViewComponent implements OnInit {
  route = inject(ActivatedRoute);
  api = inject(ApiService);

  page = signal<UserPage|null>(null);
  loading = signal(true);
  error = signal(false);

  style() {
    const s = this.page()?.page_data?.style;
    return { bg: s?.bg || '#0a0a0a', text: s?.text || '#f5f5f5', accent: s?.accent || '#8a2be2' };
  }

  ngOnInit() {
    const { username, slug } = this.route.snapshot.params;
    this.api.getPage(username, slug).subscribe({
      next: p => { this.page.set(p); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); }
    });
  }
}
