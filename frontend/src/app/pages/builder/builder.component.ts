import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

interface Section { id: string; type: string; data: any; }
interface PageStyle { bg: string; text: string; accent: string; font: string; }

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './builder.component.html',
  styleUrls: ['./builder.component.scss']
})
export class BuilderComponent implements OnInit {
  api = inject(ApiService);
  toast = inject(ToastService);
  auth = inject(AuthService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  pageId = signal<number|null>(null);
  pageName = signal('Mi Página');
  pageSlug = signal('');
  sections = signal<Section[]>([]);
  selectedId = signal<string|null>(null);
  saving = signal(false);
  previewMode = signal(false);
  showNameModal = signal(false);

  newPageName = '';
  newPageSlug = '';

  pageStyle = signal<PageStyle>({ bg: '#0a0a0a', text: '#f5f5f5', accent: '#8a2be2', font: 'Space Mono' });

  SECTION_TYPES = [
    { type: 'hero',    icon: '🏠', label: 'Hero Banner' },
    { type: 'text',    icon: '📝', label: 'Texto' },
    { type: 'image',   icon: '🖼', label: 'Imagen' },
    { type: 'skills',  icon: '⚡', label: 'Skills' },
    { type: 'cta',     icon: '🔗', label: 'Botón CTA' },
    { type: 'contact', icon: '✉',  label: 'Contacto' },
    { type: 'divider', icon: '—',  label: 'Divisor' },
  ];

  THEMES = [
    { label: 'Urban Dark',    bg: '#0a0a0a', text: '#f5f5f5', accent: '#8a2be2' },
    { label: 'Neon Night',    bg: '#050510', text: '#e0e0ff', accent: '#00ffff' },
    { label: 'Graffiti',      bg: '#0f0f0f', text: '#ffffff', accent: '#ff6b00' },
    { label: 'Minimal White', bg: '#fafafa', text: '#111111', accent: '#8a2be2' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.params['pageId'];
    if (id) {
      this.pageId.set(Number(id));
      this.loadPage(Number(id));
    } else {
      this.sections.set([this.makeSection('hero')]);
      this.showNameModal.set(true);
    }
  }

  loadPage(id: number) {
    this.api.getMyPages().subscribe({
      next: pages => {
        const page = pages.find(p => p.id === id);
        if (!page) { this.toast.show('Página no encontrada.', 'error'); this.router.navigate(['/profile']); return; }
        this.pageName.set(page.page_name);
        this.pageSlug.set(page.page_slug);
        const data = page.page_data || {};
        this.sections.set(data.sections || [this.makeSection('hero')]);
        if (data.style) this.pageStyle.set(data.style);
      }
    });
  }

  makeSection(type: string): Section {
    const id = 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const defaults: Record<string, any> = {
      hero:    { title: 'Mi Portafolio', subtitle: 'Diseñador · Developer · Creativo', bg: '', height: '100vh', align: 'center' },
      text:    { title: 'Sección', body: 'Escribe tu contenido aquí...', align: 'left' },
      image:   { src: '', alt: 'Imagen', caption: '', width: '100%' },
      skills:  { title: 'Skills', items: [{ name: 'Diseño', pct: 80 }, { name: 'Código', pct: 75 }] },
      cta:     { text: 'Ver mi trabajo', link: '#', color: '#8a2be2' },
      contact: { title: 'Contacto', email: '', showForm: true },
      divider: { color: '#222' },
    };
    return { id, type, data: defaults[type] || {} };
  }

  addSection(type: string) {
    this.sections.update(s => [...s, this.makeSection(type)]);
    const last = this.sections()[this.sections().length - 1];
    this.selectedId.set(last.id);
  }

  removeSection(id: string) {
    this.sections.update(s => s.filter(x => x.id !== id));
    if (this.selectedId() === id) this.selectedId.set(null);
  }

  moveUp(idx: number) {
    if (idx === 0) return;
    this.sections.update(s => { const a = [...s]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a; });
  }

  moveDown(idx: number) {
    if (idx === this.sections().length - 1) return;
    this.sections.update(a => { const s = [...a]; [s[idx], s[idx+1]] = [s[idx+1], s[idx]]; return s; });
  }

  selected() { return this.sections().find(s => s.id === this.selectedId()) || null; }

  updateSectionData(id: string, key: string, value: any) {
    this.sections.update(ss => ss.map(s => s.id === id ? { ...s, data: { ...s.data, [key]: value } } : s));
  }

  updateSectionDataMulti(id: string, patch: Record<string, any>) {
    this.sections.update(ss => ss.map(s => s.id === id ? { ...s, data: { ...s.data, ...patch } } : s));
  }

  // pageStyle updaters — called from template (no spread in template)
  updateStyleBg(value: string)     { this.pageStyle.update(s => ({ ...s, bg: value })); }
  updateStyleText(value: string)   { this.pageStyle.update(s => ({ ...s, text: value })); }
  updateStyleAccent(value: string) { this.pageStyle.update(s => ({ ...s, accent: value })); }

  applyTheme(theme: { bg: string; text: string; accent: string; label: string }) {
    this.pageStyle.update(s => ({ ...s, bg: theme.bg, text: theme.text, accent: theme.accent }));
  }

  // Slug auto-generation — done in TS, not template
  onPageNameInput(name: string) {
    this.newPageName = name;
    this.newPageSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  confirmName() {
    if (!this.newPageName.trim()) { this.toast.show('El nombre es requerido.', 'error'); return; }
    this.pageName.set(this.newPageName.trim());
    this.pageSlug.set(this.newPageSlug.trim() || this.newPageName.trim().toLowerCase().replace(/\s+/g, '-'));
    this.showNameModal.set(false);
  }

  savePage() {
    if (!this.pageName()) { this.toast.show('Define el nombre primero.', 'error'); return; }
    this.saving.set(true);
    const payload = {
      page_name: this.pageName(),
      page_slug: this.pageSlug(),
      page_data: { sections: this.sections(), style: this.pageStyle() }
    };
    const obs = this.pageId() ? this.api.updatePage(this.pageId()!, payload) : this.api.createPage(payload);
    obs.subscribe({
      next: (page) => {
        this.saving.set(false);
        this.pageId.set(page.id);
        this.toast.show('Página guardada ✓');
        this.router.navigate(['/builder', page.id], { replaceUrl: true });
      },
      error: (err) => { this.saving.set(false); this.toast.show(err.error?.error || 'Error al guardar.', 'error'); }
    });
  }

  addSkillItem(sectionId: string) {
    const sec = this.selected();
    if (!sec) return;
    this.updateSectionData(sectionId, 'items', [...(sec.data.items || []), { name: 'Nuevo skill', pct: 60 }]);
  }

  removeSkillItem(sectionId: string, idx: number) {
    const sec = this.selected();
    if (!sec) return;
    this.updateSectionData(sectionId, 'items', sec.data.items.filter((_: any, i: number) => i !== idx));
  }

  updateSkillName(sectionId: string, idx: number, name: string) {
    const sec = this.selected();
    if (!sec) return;
    const items = sec.data.items.map((it: any, i: number) => i === idx ? { ...it, name } : it);
    this.updateSectionData(sectionId, 'items', items);
  }

  updateSkillPct(sectionId: string, idx: number, pct: number) {
    const sec = this.selected();
    if (!sec) return;
    const items = sec.data.items.map((it: any, i: number) => i === idx ? { ...it, pct } : it);
    this.updateSectionData(sectionId, 'items', items);
  }

  onImageFile(event: Event, sectionId: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.updateSectionData(sectionId, 'src', reader.result as string);
    reader.readAsDataURL(file);
  }

  viewPage() {
    const u = this.auth.currentUser();
    if (!u || !this.pageId()) return;
    window.open('/p/' + u.username + '/' + this.pageSlug(), '_blank');
  }

  getInputVal(event: Event): string { return (event.target as HTMLInputElement).value; }
}
