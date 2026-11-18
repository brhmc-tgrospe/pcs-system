// ============================================================
// PCS Portal — Shared TypeScript Types
// These match Laravel's snake_case JSON serialization exactly.
// ============================================================

export type UserRole = 'user' | 'administrator' | 'superadmin' | 'developer';

export interface UserPermissions {
  manage_items: boolean;
  force_delete: boolean;
  manage_categories: boolean;
  manage_bidders: boolean;
  manage_users: boolean;
  view_logs: boolean;
  manage_settings: boolean;
  impersonate: boolean;
  delete_reports?: boolean;
  restore_reports?: boolean;
  force_delete_reports?: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_impersonating: boolean;
  can: UserPermissions;
}

export interface Category {
  id: number;
  name: string;
  cat_code: string;
  description: string | null;
  parent_id?: number | null;
  items_count?: number;
  deleted_at?: string | null;
}

export interface Bidder {
  id: number;
  name: string;
  bidder_code?: string;
  contact_person: string | null;
  contact_number: string | null;
  email: string | null;
  address: string | null;
  location?: string | null;
  brand_name?: string | null;
  country_of_origin?: string | null;
  origin?: string | null;
  pivot?: {
    unit_cost: number;
  };
  deleted_at?: string | null;
}

export type ItemStatus = 'Active' | 'No Bid' | 'Pending Award' | 'Failed Bid' | 'Awarded' | 'Closed';

export interface Item {
  id: number;
  item_code: string;
  name: string;
  description: string;
  unit_type: string;
  unit_cost: number;
  quantity: number;
  abc: number;
  status?: ItemStatus;
  awarded_bidder_id?: number | null;
  awarded_bidder?: Bidder | null;
  awarded_unit_cost?: number | null;
  awarded_abc?: number | null;

  category_id: number;
  image_url?: string | null;
  category?: Category;
  bidders?: Bidder[];
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
  first_name?: string;
  last_name?: string;
  full_name: string;
  email: string;
  role: UserRole;
  can_edit?: boolean;
  can_delete?: boolean;
}

export interface ManageUsersProps extends Record<string, unknown> {
  users: UserSummary[];
  assignable_roles?: UserRole[];
  auth: { user: AuthUser };
}

export interface Signatory {
  id: number;
  name: string;
  designation: string;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReportMetadata {
  project_ref_no: string;
  contract_name: string;
  contract_location: string;
  implementing_office: string;
  report_date: string;
  report_time: string;
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
  bidders: Bidder[];
  recentLogs: ActivityLogEntry[];
  users?: UserSummary[];
  auth: { user: AuthUser };
}

export interface DatabaseTableBreakdown {
  table: string;
  rows: number;
  size_mb: number;
  data_mb: number;
  index_mb: number;
  data_bytes?: number;
  index_bytes?: number;
  total_bytes?: number;
  data_size_formatted?: string;
  index_size_formatted?: string;
  total_size_formatted?: string;
  collation?: string;
}

export interface BackupArchive {
  filename: string;
  size_bytes: number;
  size_formatted: string;
  created_at: string;
  created_at_formatted?: string;
  created_at_human: string;
}

export interface BackupSchedule {
  id?: number;
  frequency: 'weekly' | 'monthly';
  day: number;
  time: string;
  is_enabled: boolean;
  last_run_at?: string | null;
  last_status?: string | null;
}

export interface BackupStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress_percent: number;
  step_message: string;
  filename: string | null;
  error_message: string | null;
  started_at?: string | null;
  finished_at?: string | null;
}

export interface SettingsPageProps {
  auth: { user: AuthUser };
  users?: UserSummary[];
  signatories?: Signatory[];
  backups?: BackupArchive[];
  backupSchedule?: BackupSchedule;
  backupStatus?: BackupStatus;
}

export interface ReportViewProps {
  items: Item[];
  categories: Category[];
  signatories: Signatory[];
  metadata: ReportMetadata;
  timestamp: string;
}

export interface ActivityLogsProps {
  logs: LaravelPagination<ActivityLogEntry>;
  search: string;
  auth: { user: AuthUser };
}

export interface SearchResults {
  items: Item[];
  categories: Category[];
  bidders: Bidder[];
  users: UserSummary[];
}

export interface SavedReport {
  id: number;
  user_id: number;
  project_ref_no: string | null;
  contract_name: string;
  file_name: string;
  file_path: string;
  file_size: number;
  item_count: number;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  user?: UserSummary;
}

export interface SavedReportsProps {
  reports: LaravelPagination<SavedReport>;
  filters: {
    search: string;
    status: 'active' | 'trashed';
    sort_field: string;
    sort_direction: 'asc' | 'desc';
    per_page: number;
  };
  counts: {
    active: number;
    trashed: number;
  };
  auth: { user: AuthUser };
  flash?: {
    success?: string | null;
    error?: string | null;
  };
}

