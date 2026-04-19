import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, SiteSettings, ContactMessage, AdminStats } from '../../models/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  api = inject(ApiService);
  toast = inject(ToastService);
  auth = inject(AuthService);

  activeTab = signal<'hero'|'projects'|'users'|'messages'|'appearance'>('hero');
  stats = signal<AdminStats|null>(null);

  // Hero settings
  settings: SiteSettings = { hero_title: '', hero_subtitle: '', hero_cta: '', primary_color: '#8a2be2', accent_color: '#ff00ff' };

  // Projects
  projects = signal<Project[]>([]);
  showAddProject = signal(false);
  newProject: Partial<Project> = { title: '', description: '', image: '', tags: [], tech: '', link: '' };
  newTagInput = '';
  editingProject = signal<Project|null>(null);

  // Users
  users = signal<any[]>([]);

  // Messages
  messages = signal<ContactMessage[]>([]);

  // Admin profile
  adminBio = '';
  adminLocation = '';
  adminBannerGrad = '';
  adminBannerImg = '';
  adminBtnText = '';
  adminBtnLink = '';
  adminBtnColor = '#8a2be2';

  savingHero = signal(false);
  savingProj = signal(false);
  savingAdmin = signal(false);

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.api.adminGetStats().subscribe({ next: s => this.stats.set(s), error: () => {} });
    this.api.adminGetSettings().subscribe({ next: s => { this.settings = { ...s }; }, error: () => {} });
    this.api.getProjects().subscribe({ next: p => this.projects.set(p), error: () => {} });
    this.api.adminGetUsers().subscribe({ next: u => this.users.set(u), error: () => {} });
    this.api.adminGetMessages().subscribe({ next: m => this.messages.set(m), error: () => {} });
    const u = this.auth.currentUser();
    if (u) {
      this.adminBio = u.bio; this.adminLocation = u.location;
      this.adminBannerGrad = u.banner_grad; this.adminBannerImg = u.banner_img;
      this.adminBtnText = u.btn_text; this.adminBtnLink = u.btn_link; this.adminBtnColor = u.btn_color;
    }
  }

  saveHero() {
    this.savingHero.set(true);
    this.api.adminSaveSettings(this.settings).subscribe({
      next: () => { this.savingHero.set(false); this.toast.show('Hero guardado ✓'); },
      error: () => { this.savingHero.set(false); this.toast.show('Error.', 'error'); }
    });
  }

  addTag() {
    const tag = this.newTagInput.trim();
    if (!tag) return;
    if (!this.newProject.tags) this.newProject.tags = [];
    this.newProject.tags = [...this.newProject.tags, tag];
    this.newTagInput = '';
  }

  removeTag(t: string) {
    this.newProject.tags = (this.newProject.tags || []).filter(x => x !== t);
  }

  saveProject() {
    if (!this.newProject.title) { this.toast.show('El título es requerido.', 'error'); return; }
    this.savingProj.set(true);
    const ep = this.editingProject();
    const obs = ep
      ? this.api.updateProject(ep.id, this.newProject)
      : this.api.createProject(this.newProject);

    obs.subscribe({
      next: (p) => {
        this.savingProj.set(false);
        this.showAddProject.set(false);
        this.editingProject.set(null);
        this.api.getProjects().subscribe(ps => this.projects.set(ps));
        this.toast.show(ep ? 'Proyecto actualizado ✓' : 'Proyecto creado ✓');
        this.resetNewProject();
      },
      error: () => { this.savingProj.set(false); this.toast.show('Error.', 'error'); }
    });
  }

  openEditProject(p: Project) {
    this.editingProject.set(p);
    this.newProject = { ...p, tags: [...(p.tags || [])] };
    this.showAddProject.set(true);
  }

  cancelProject() {
    this.showAddProject.set(false);
    this.editingProject.set(null);
    this.resetNewProject();
  }

  resetNewProject() { this.newProject = { title: '', description: '', image: '', tags: [], tech: '', link: '' }; this.newTagInput = ''; }

  deleteProject(id: number) {
    if (!confirm('¿Eliminar proyecto?')) return;
    this.api.deleteProject(id).subscribe({
      next: () => { this.projects.update(p => p.filter(x => x.id !== id)); this.toast.show('Proyecto eliminado.'); },
      error: () => this.toast.show('Error.', 'error')
    });
  }

  deleteUser(id: number, username: string) {
    if (!confirm(`¿Eliminar usuario "${username}"? Esto borrará también sus páginas.`)) return;
    this.api.adminDeleteUser(id).subscribe({
      next: () => { this.users.update(u => u.filter(x => x.id !== id)); this.toast.show('Usuario eliminado.'); },
      error: (err) => this.toast.show(err.error?.error || 'Error.', 'error')
    });
  }

  markRead(id: number) {
    this.api.adminMarkRead(id).subscribe({
      next: () => this.messages.update(m => m.map(x => x.id === id ? { ...x, read: 1 } : x)),
      error: () => {}
    });
  }

  deleteMessage(id: number) {
    this.api.adminDeleteMessage(id).subscribe({
      next: () => { this.messages.update(m => m.filter(x => x.id !== id)); this.toast.show('Mensaje eliminado.'); },
      error: () => {}
    });
  }

  saveAppearance() {
    this.api.adminSaveSettings({ primary_color: this.settings.primary_color, accent_color: this.settings.accent_color }).subscribe({
      next: () => {
        document.documentElement.style.setProperty('--purple', this.settings.primary_color);
        document.documentElement.style.setProperty('--neon-pink', this.settings.accent_color);
        this.toast.show('Colores aplicados ✓');
      },
      error: () => this.toast.show('Error.', 'error')
    });
  }

  saveAdminProfile() {
    this.savingAdmin.set(true);
    this.api.adminUpdateProfile({
      bio: this.adminBio, location: this.adminLocation,
      banner_grad: this.adminBannerGrad, banner_img: this.adminBannerImg,
      btn_text: this.adminBtnText, btn_link: this.adminBtnLink, btn_color: this.adminBtnColor
    }).subscribe({
      next: () => {
        this.auth.refreshUser().subscribe();
        this.savingAdmin.set(false);
        this.toast.show('Perfil admin guardado ✓');
      },
      error: () => { this.savingAdmin.set(false); this.toast.show('Error.', 'error'); }
    });
  }

  unreadCount() { return this.messages().filter(m => !m.read).length; }
}
