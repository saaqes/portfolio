import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { LoginModalComponent } from './shared/login-modal/login-modal.component';
import { ToastComponent } from './shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, LoginModalComponent, ToastComponent],
  template: `
    <app-navbar />
    <router-outlet />
    <app-login-modal />
    <app-toast />
  `
})
export class AppComponent {}
