import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project, UserPage, SiteSettings, ContactMessage, User, AdminStats } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // ── Projects ──
  getProjects() { return this.http.get<Project[]>('/api/projects'); }
  createProject(data: Partial<Project>) { return this.http.post<Project>('/api/projects', data); }
  updateProject(id: number, data: Partial<Project>) { return this.http.put<Project>(`/api/projects/${id}`, data); }
  deleteProject(id: number) { return this.http.delete<{ok:boolean}>(`/api/projects/${id}`); }

  // ── User Pages ──
  getMyPages() { return this.http.get<UserPage[]>('/api/pages'); }
  getPage(username: string, slug: string) { return this.http.get<UserPage>(`/api/pages/view/${username}/${slug}`); }
  createPage(data: Partial<UserPage>) { return this.http.post<UserPage>('/api/pages', data); }
  updatePage(id: number, data: Partial<UserPage>) { return this.http.put<UserPage>(`/api/pages/${id}`, data); }
  deletePage(id: number) { return this.http.delete<{ok:boolean}>(`/api/pages/${id}`); }

  // ── Profile ──
  getProfile(username: string) { return this.http.get<{user: User, pages: UserPage[]}>(`/api/profile/${username}`); }
  updateProfile(data: Partial<User>) { return this.http.put<User>('/api/profile', data); }
  updateBanner(data: {banner_img?: string, banner_grad?: string}) { return this.http.put<{ok:boolean}>('/api/profile/banner/update', data); }

  // ── Site Settings (public) ──
  getSettings() { return this.http.get<SiteSettings>('/api/contact/settings'); }

  // ── Contact ──
  sendContact(data: {name:string, email:string, message:string}) {
    return this.http.post<{ok:boolean, message:string}>('/api/contact', data);
  }

  // ── Admin ──
  adminGetUsers() { return this.http.get<any[]>('/api/admin/users'); }
  adminDeleteUser(id: number) { return this.http.delete<{ok:boolean}>(`/api/admin/users/${id}`); }
  adminGetSettings() { return this.http.get<SiteSettings>('/api/admin/settings'); }
  adminSaveSettings(data: Partial<SiteSettings>) { return this.http.put<SiteSettings>('/api/admin/settings', data); }
  adminUpdateProfile(data: Partial<User>) { return this.http.put<User>('/api/admin/profile', data); }
  adminGetMessages() { return this.http.get<ContactMessage[]>('/api/admin/messages'); }
  adminMarkRead(id: number) { return this.http.put<{ok:boolean}>(`/api/admin/messages/${id}/read`, {}); }
  adminDeleteMessage(id: number) { return this.http.delete<{ok:boolean}>(`/api/admin/messages/${id}`); }
  adminGetStats() { return this.http.get<AdminStats>('/api/admin/stats'); }
  getPublicStats() { return this.http.get<{projectCount:number,userCount:number,pageCount:number,years:number}>('/api/contact/stats'); }
}
