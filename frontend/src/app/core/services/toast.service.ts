import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  msg: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(msg: string, type: Toast['type'] = 'success', duration = 3000) {
    const id = ++this.nextId;
    this.toasts.update(t => [...t, { id, msg, type }]);
    setTimeout(() => this.remove(id), duration);
  }

  remove(id: number) {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }
}
