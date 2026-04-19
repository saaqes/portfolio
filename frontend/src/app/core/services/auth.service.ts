import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { User, AuthResponse } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'saqes_token';
  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      this.http.get<User>('/api/auth/me').subscribe({
        next: user => this.currentUser.set(user),
        error: () => this.clearToken()
      });
    }
  }

  login(username: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/login', { username, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        this.currentUser.set(res.user);
      })
    );
  }

  register(username: string, email: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/register', { username, email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        this.currentUser.set(res.user);
      })
    );
  }

  logout() {
    this.clearToken();
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUser();
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }

  private clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
  }

  refreshUser() {
    return this.http.get<User>('/api/auth/me').pipe(
      tap(user => this.currentUser.set(user))
    );
  }
}
