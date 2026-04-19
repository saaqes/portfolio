import { Component, OnInit, inject, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ModalService } from '../../core/services/modal.service';
import { Project, SiteSettings } from '../../models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {
  api    = inject(ApiService);
  toast  = inject(ToastService);
  auth   = inject(AuthService);
  modal  = inject(ModalService);

  projects = signal<Project[]>([]);
  settings = signal<SiteSettings>({
    hero_title: 'SAQES', hero_subtitle: 'Diseño Urbano · Código · Creatividad',
    hero_cta: 'CREA TU PÁGINA', primary_color: '#8a2be2', accent_color: '#ff00ff'
  });

  // Stats counters
  statProjects = signal(0);
  statUsers    = signal(0);
  statPages    = signal(0);
  statYears    = signal(3);

  // Contact form
  contactName = ''; contactEmail = ''; contactMsg = '';
  sendingContact = signal(false);

  skills = [
    { icon: '🎨', name: 'Diseño UI/UX',   desc: 'Interfaces intuitivas y visualmente impactantes para web y mobile.',     pct: 92 },
    { icon: '💻', name: 'Desarrollo Web',  desc: 'Frontend moderno con HTML, CSS, JS y frameworks actuales.',              pct: 88 },
    { icon: '📱', name: 'Apps Móviles',    desc: 'Aplicaciones nativas y web optimizadas para touch.',                     pct: 75 },
    { icon: '✏️', name: 'Branding',        desc: 'Identidades visuales únicas para marcas urbanas.',                       pct: 80 },
    { icon: '🎬', name: 'Motion Design',   desc: 'Animaciones que dan vida a interfaces y presentaciones.',                pct: 70 },
    { icon: '🌐', name: 'SEO & Marketing', desc: 'Estrategias para maximizar el alcance digital.',                         pct: 85 },
  ];

  timeline = [
    { year: '2020',       title: 'Inicio en Diseño Digital',   desc: 'Primeros pasos en diseño UI freelance. Proyectos para marcas locales en Colombia con enfoque en identidad visual urbana.', side: 'right' },
    { year: '2021 — 2022', title: 'Especialización en Frontend', desc: 'Dominio de React, Tailwind y CSS avanzado. Primeros proyectos web full para clientes internacionales.',               side: 'left'  },
    { year: '2023',       title: 'SAQES Builder — Alpha',       desc: 'Desarrollo del primer website builder visual especializado en diseño urbano. Más de 200 usuarios en 3 meses.',          side: 'right' },
    { year: '2024 — HOY', title: 'Plataforma Completa',         desc: 'Expansión del ecosistema SAQES con editor visual avanzado, perfil de usuario y portfolio interactivo.',                  side: 'left'  },
  ];

  testimonials = [
    { text: 'SAQES transformó completamente la presencia digital de nuestra marca. El proceso fue rápido y el resultado superó todas nuestras expectativas.', avatar: '🎧', name: 'Alex Morales',    role: 'CEO — Beats Underground' },
    { text: 'La plataforma de creación de páginas es increíble. En menos de una hora tenía mi portfolio profesional listo.',                                   avatar: '🎨', name: 'Valentina Cruz',  role: 'Artista Visual'           },
    { text: 'Nunca pensé que podría tener un sitio tan profesional sin saber programar. SAQES lo hace todo intuitivo.',                                         avatar: '🎤', name: 'Rodrigo Méndez', role: 'Músico Independiente'     },
  ];

  ngOnInit() {
    this.loadProjects();
    this.loadSettings();
    this.loadStats();
  }

  ngAfterViewInit() {
    this.setupScrollAnimations();
  }

  loadProjects() {
    this.api.getProjects().subscribe({ next: p => this.projects.set(p), error: () => {} });
  }

  loadSettings() {
    this.api.getSettings().subscribe({
      next: s => { this.settings.set(s); this.applyCssVars(s); },
      error: () => {}
    });
  }

  loadStats() {
    this.api.getPublicStats().subscribe({
      next: s => {
        this.animateCounter(this.statProjects, s.projectCount);
        this.animateCounter(this.statUsers,    s.userCount);
        this.animateCounter(this.statPages,    s.pageCount);
        this.animateCounter(this.statYears,    3);
      },
      error: () => {
        // si no es admin, usar los proyectos públicos para la stat
        this.api.getProjects().subscribe(p => this.animateCounter(this.statProjects, p.length));
      }
    });
  }

  animateCounter(sig: ReturnType<typeof signal<number>>, target: number, dur = 1800) {
    const steps = 40;
    const inc = target / steps;
    let cur = 0;
    const interval = setInterval(() => {
      cur = Math.min(cur + inc, target);
      sig.set(Math.round(cur));
      if (cur >= target) clearInterval(interval);
    }, dur / steps);
  }

  applyCssVars(s: SiteSettings) {
    if (s.primary_color) document.documentElement.style.setProperty('--purple', s.primary_color);
    if (s.accent_color)  document.documentElement.style.setProperty('--neon-pink', s.accent_color);
  }

  setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('appear');
          // animate skill bars
          e.target.querySelectorAll('.skill-bar').forEach((bar: any) => {
            const pct = bar.getAttribute('data-pct');
            if (pct) setTimeout(() => bar.style.width = pct + '%', 200);
          });
        }
      });
    }, { threshold: 0.1 });

    setTimeout(() => {
      document.querySelectorAll('.fade-in, .slide-left, .slide-right, .zoom-in, .stagger-item')
        .forEach(el => observer.observe(el));
    }, 100);
  }

  sendContact() {
    if (!this.contactName || !this.contactEmail || !this.contactMsg) {
      this.toast.show('Completa todos los campos.', 'error'); return;
    }
    this.sendingContact.set(true);
    this.api.sendContact({ name: this.contactName, email: this.contactEmail, message: this.contactMsg }).subscribe({
      next: (res) => {
        this.sendingContact.set(false);
        this.toast.show(res.message || '¡Mensaje enviado!');
        this.contactName = ''; this.contactEmail = ''; this.contactMsg = '';
      },
      error: (err) => { this.sendingContact.set(false); this.toast.show(err.error?.error || 'Error al enviar.', 'error'); }
    });
  }

  openLogin() { this.modal.openLogin(); }
}
