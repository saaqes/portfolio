import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ModalService {
  loginOpen = signal(false);
  openLogin() { this.loginOpen.set(true); }
  closeLogin() { this.loginOpen.set(false); }
}
