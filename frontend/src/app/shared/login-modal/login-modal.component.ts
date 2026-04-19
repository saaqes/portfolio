import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss']
})
export class LoginModalComponent {
  auth = inject(AuthService);
  modal = inject(ModalService);
  toast = inject(ToastService);

  tab = signal<'login'|'register'>('login');
  loading = signal(false);
  error = signal('');

  // Login fields
  loginUser = '';
  loginPass = '';

  // Register fields
  regUser = '';
  regEmail = '';
  regPass = '';
  regPass2 = '';

  switchTab(t: 'login'|'register') {
    this.tab.set(t);
    this.error.set('');
  }

  close() {
    this.modal.closeLogin();
    this.error.set('');
    this.loginUser = '';
    this.loginPass = '';
    this.regUser = '';
    this.regEmail = '';
    this.regPass = '';
    this.regPass2 = '';
  }

  handleLogin() {
    if (!this.loginUser || !this.loginPass) {
      this.error.set('Completa todos los campos.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.loginUser, this.loginPass).subscribe({
      next: () => {
        this.loading.set(false);
        this.close();
        this.toast.show('¡Bienvenido de nuevo!');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Error al iniciar sesión.');
      }
    });
  }

  handleRegister() {
    if (!this.regUser || !this.regEmail || !this.regPass || !this.regPass2) {
      this.error.set('Completa todos los campos.');
      return;
    }
    if (this.regPass !== this.regPass2) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    if (this.regPass.length < 6) {
      this.error.set('Contraseña mínimo 6 caracteres.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.regUser, this.regEmail, this.regPass).subscribe({
      next: () => {
        this.loading.set(false);
        this.close();
        this.toast.show('¡Cuenta creada! Bienvenido a SAQES.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Error al registrar.');
      }
    });
  }
}
