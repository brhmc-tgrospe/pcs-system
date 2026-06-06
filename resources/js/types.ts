// ============================================================
// PCS Portal — Shared TypeScript Types
// These match Laravel's snake_case JSON serialization exactly.
// ============================================================

export type UserRole = 'user' | 'administrator' | 'developer';

export interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_impersonating: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  items_count?: number;
  deleted_at?: string | null;
}

export interface Item {
  id: number;
  item_code: string;
  name: string;
  description: string;
  specifications: Record<string, string>;
  unit_type: string;
  unit_price: number;
  price_referral?: string | null;
  category_id: number;
  is_active: boolean;
  image_url?: string | null;
  category?: Category;
  deleted_at?: string | null;
}

export interface ActivityLogEntry {
  id: number;
  action: string;
  description: string | null;
  subject_type: string | null;
  subject_id: number | null;
  ip_address: string | null;
  created_at: string; // ISO string
  user: {
    username: string;
    full_name: string;
  } | null;
}

export interface UserSummary {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
}

export interface LaravelPagination<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: { url: string | null; label: string; active: boolean }[];
}

// Inertia page props
export interface CatalogAppProps {
  items: Item[];
  categories: Category[];
  recentLogs: ActivityLogEntry[];
  users?: UserSummary[];
  auth: { user: AuthUser };
}

export interface ActivityLogsProps {
  logs: LaravelPagination<ActivityLogEntry>;
  search: string;
  auth: { user: AuthUser };
}
