import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="t.type" (click)="toast.remove(t.id)">
          {{ t.msg }}
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; gap: 10px; align-items: center; pointer-events: none; }
    .toast { padding: 13px 24px; border-radius: 4px; font-family: 'Space Mono', monospace; font-size: .82rem; animation: toast-in .3s ease; cursor: pointer; pointer-events: all; white-space: nowrap; }
    .success { background: var(--purple); color: white; }
    .error { background: #ff4444; color: white; }
    .info { background: #1a1a1a; border: 1px solid var(--purple); color: var(--white); }
    @keyframes toast-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ToastComponent {
  toast = inject(ToastService);
}
