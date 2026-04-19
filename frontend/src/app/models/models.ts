export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  bio: string;
  location: string;
  avatar: string;
  banner_img: string;
  banner_grad: string;
  btn_text: string;
  btn_link: string;
  btn_color: string;
  btn_style: string;
  created_at: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  tags: string[];
  tech: string;
  link: string;
  order_idx: number;
  created_at: string;
}

export interface UserPage {
  id: number;
  user_id: number;
  page_name: string;
  page_slug: string;
  page_data: any;
  thumbnail: string;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  primary_color: string;
  accent_color: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  read: number;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AdminStats {
  userCount: number;
  pageCount: number;
  projectCount: number;
  unreadMessages: number;
}
