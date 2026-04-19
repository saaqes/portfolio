import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { User, UserPage } from '../../models/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  auth = inject(AuthService);
  api = inject(ApiService);
  toast = inject(ToastService);

  pages = signal<UserPage[]>([]);
  activeTab = signal<'pages'|'settings'>('pages');
  editMode = signal(false);
  loading = signal(false);
  deletingId = signal<number|null>(null);

  // Edit fields
  editBio = '';
  editLocation = '';
  editAvatar = '';

  BANNER_GRADS = [
    'linear-gradient(135deg,#1a0040,#4b0082,#1a1a2e)',
    'linear-gradient(135deg,#0a0a0a,#1a1a1a,#0d0015)',
    'linear-gradient(135deg,#001a00,#004b00,#001a1a)',
    'linear-gradient(135deg,#1a0000,#4b0000,#1a1a00)',
    'linear-gradient(135deg,#00001a,#00004b,#001a1a)',
    'linear-gradient(135deg,#1a1a00,#4b4b00,#1a001a)',
  ];

  user() { return this.auth.currentUser(); }

  ngOnInit() { this.loadPages(); }

  loadPages() {
    this.api.getMyPages().subscribe({ next: p => this.pages.set(p), error: () => {} });
  }

  switchTab(t: 'pages'|'settings') { this.activeTab.set(t); }

  openEdit() {
    const u = this.user();
    if (!u) return;
    this.editBio = u.bio;
    this.editLocation = u.location;
    this.editAvatar = u.avatar;
    this.editMode.set(true);
  }

  saveEdit() {
    this.loading.set(true);
    this.api.updateProfile({ bio: this.editBio, location: this.editLocation, avatar: this.editAvatar }).subscribe({
      next: () => {
        this.auth.refreshUser().subscribe();
        this.editMode.set(false);
        this.loading.set(false);
        this.toast.show('Perfil actualizado ✓');
      },
      error: () => { this.loading.set(false); this.toast.show('Error al guardar.', 'error'); }
    });
  }

  setBanner(grad: string) {
    this.api.updateBanner({ banner_grad: grad, banner_img: '' }).subscribe({
      next: () => { this.auth.refreshUser().subscribe(); this.toast.show('Banner actualizado ✓'); },
      error: () => this.toast.show('Error.', 'error')
    });
  }

  onAvatarFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.editAvatar = reader.result as string; };
    reader.readAsDataURL(file);
  }

  deletePage(id: number) {
    if (!confirm('¿Eliminar esta página?')) return;
    this.deletingId.set(id);
    this.api.deletePage(id).subscribe({
      next: () => { this.pages.update(p => p.filter(x => x.id !== id)); this.deletingId.set(null); this.toast.show('Página eliminada.'); },
      error: () => { this.deletingId.set(null); this.toast.show('Error al eliminar.', 'error'); }
    });
  }

  getPageUrl(page: UserPage): string {
    return `/p/${this.user()?.username}/${page.page_slug}`;
  }
}
