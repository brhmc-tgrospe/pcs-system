import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import {
  HardDrive,
  Database,
  Server,
  Clock,
  Download,
  Trash2,
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calendar,
  ShieldCheck,
  Layers,
  Search,
  ArrowUpRight,
  X,
  ShieldAlert,
} from 'lucide-react';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/Header';
import ImpersonationBanner from '@/Components/ImpersonationBanner';
import Toast from '@/Components/Toast';
import Modal from '@/Components/Modal';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { AuthUser, UserSummary } from '@/types';

interface TableInfo {
  name: string;
  rows: number;
  data_size_bytes: number;
  data_size_formatted: string;
  index_size_bytes: number;
  index_size_formatted: string;
  total_size_bytes: number;
  total_size_formatted: string;
  size_bytes?: number;
  size_formatted?: string;
}

interface BackupHistoryItem {
  id: number;
  filename: string;
  file_size: number | null;
  file_size_formatted: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error_message: string | null;
  health_summary: any;
  created_at: string;
  created_at_relative: string;
  triggered_by_name: string;
}

interface BackupScheduleData {
  id?: number;
  is_enabled: boolean;
  frequency: 'weekly' | 'monthly';
  day_of_week: number;
  day_of_month: number;
  execution_time: string;
  last_run_at?: string | null;
}

interface HealthSnapshot {
  timestamp: string;
  timestamp_formatted: string;
  timezone: string;
  server: {
    os: string;
    os_description: string;
    php_version: string;
    memory_limit: string;
    current_memory_usage: string;
    peak_memory_usage: string;
    max_execution_time: string;
    opcache_enabled: boolean;
  };
  storage: {
    path: string;
    total_bytes: number;
    free_bytes: number;
    used_bytes: number;
    total_formatted: string;
    free_formatted: string;
    used_formatted: string;
    used_percentage: number;
    is_low_space: boolean;
  };
  database: {
    connection: string;
    database_name: string;
    status: string;
    version: string;
    total_size_bytes: number;
    total_size_formatted: string;
    total_tables: number;
    total_rows: number;
    active_threads: number | null;
    uptime_seconds: number | null;
    tables: TableInfo[];
  };
  application: {
    app_name: string;
    environment: string;
    laravel_version: string;
    debug_mode: boolean;
    queue_connection: string;
    storage_writable: boolean;
    timezone: string;
  };
}

interface SystemHealthProps {
  auth: { user: AuthUser };
  users?: UserSummary[];
  health: HealthSnapshot;
  schedule: BackupScheduleData;
  formattedLastRun: string | null;
  backupHistories: BackupHistoryItem[];
  hasActiveBackup: boolean;
}

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function SystemHealth({
  auth,
  users,
  health,
  schedule,
  formattedLastRun,
  backupHistories = [],
  hasActiveBackup = false,
}: SystemHealthProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTriggeringBackup, setIsTriggeringBackup] = useState(false);

  // Schedule Form State
  const [scheduleForm, setScheduleForm] = useState({
    is_enabled: Boolean(schedule?.is_enabled),
    frequency: schedule?.frequency || 'weekly',
    day_of_week: schedule?.day_of_week ?? 0,
    day_of_month: schedule?.day_of_month ?? 1,
    execution_time: schedule?.execution_time || '02:00',
  });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Delete Backup Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<BackupHistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Database Table Breakdown Modal State
  const [isTableBreakdownOpen, setIsTableBreakdownOpen] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  // Sync schedule form state if props change
  useEffect(() => {
    if (schedule) {
      setScheduleForm({
        is_enabled: Boolean(schedule.is_enabled),
        frequency: schedule.frequency || 'weekly',
        day_of_week: schedule.day_of_week ?? 0,
        day_of_month: schedule.day_of_month ?? 1,
        execution_time: schedule.execution_time || '02:00',
      });
    }
  }, [schedule]);

  // Polling interval for active backups
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (hasActiveBackup) {
      pollInterval = setInterval(() => {
        router.reload({
          only: ['backupHistories', 'hasActiveBackup', 'health'],
          preserveScroll: true,
        });
      }, 3000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [hasActiveBackup]);

  // Non-developer role protection fallback
  if (auth.user.role !== 'developer') {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 text-center shadow-lg">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Developer Access Required</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            The System Health & Backups console is strictly reserved for users with the developer role.
          </p>
          <button
            onClick={() => router.visit('/catalog')}
            className="mt-6 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Return to Master Projects
          </button>
        </div>
      </div>
    );
  }

  // Refresh Metrics Handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    router.reload({
      preserveScroll: true,
      onFinish: () => {
        setIsRefreshing(false);
      },
    });
  };

  // Trigger Backup Handler
  const handleCreateBackup = (sync = false) => {
    setIsTriggeringBackup(true);
    router.post(
      '/system-health/backup',
      { sync },
      {
        preserveScroll: true,
        onFinish: () => {
          setIsTriggeringBackup(false);
        },
      }
    );
  };

  // Schedule Submit Handler
  const handleSubmitSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSchedule(true);
    router.put('/system-health/schedule', scheduleForm, {
      preserveScroll: true,
      onFinish: () => {
        setIsSavingSchedule(false);
      },
    });
  };

  // Delete Backup Handlers
  const confirmDeleteBackup = (backup: BackupHistoryItem) => {
    setBackupToDelete(backup);
    setIsDeleteModalOpen(true);
  };

  const executeDeleteBackup = () => {
    if (!backupToDelete) return;
    setIsDeleting(true);

    router.delete(`/system-health/backup/${backupToDelete.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setBackupToDelete(null);
      },
      onFinish: () => {
        setIsDeleting(false);
      },
    });
  };

  // Filtered tables for modal
  const filteredTables = useMemo(() => {
    const tables = health?.database?.tables || [];
    if (!tableSearchQuery.trim()) {
      return tables;
    }
    const q = tableSearchQuery.toLowerCase().trim();
    return tables.filter((t) => t.name.toLowerCase().includes(q));
  }, [health?.database?.tables, tableSearchQuery]);

  const completedBackupsCount = useMemo(() => {
    return (backupHistories || []).filter((b) => b.status === 'completed').length;
  }, [backupHistories]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Head title="System Health & Database Backup" />
      <Toast />

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        user={auth.user}
        currentView="system_health"
        onNavigate={(view) => {
          router.visit(view === 'dashboard' ? '/catalog' : `/catalog?view=${view}`);
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {auth.user.is_impersonating && <ImpersonationBanner user={auth.user} />}
        <Header onOpenMobile={() => setIsMobileOpen(true)} user={auth.user} users={users} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header section matching HICS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-2xl border border-white/80 dark:border-slate-700/80 shadow-sm">
              <div>
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-xl">
                    <ShieldCheck className="w-6 h-6" />
                  </span>
                  <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                      System Health & Database Backup
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Live system monitoring, zero-lock MySQL backups, and automated schedule configuration.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
                  Refresh Metrics
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateBackup(false)}
                  disabled={hasActiveBackup || isTriggeringBackup}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hasActiveBackup || isTriggeringBackup ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  <span>{hasActiveBackup ? 'Backup Processing...' : 'Create Backup Now'}</span>
                </button>
              </div>
            </div>

            {/* Active backup running alert banner */}
            {hasActiveBackup && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 p-4 rounded-2xl flex items-center gap-3 animate-pulse shadow-sm">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="text-sm">
                  <span className="font-bold">A database and system health backup is currently in progress.</span>
                  <span className="ml-1 text-blue-700 dark:text-blue-300">
                    The bundle is being assembled with zero table locking. This table updates automatically every 3 seconds.
                  </span>
                </div>
              </div>
            )}

            {/* System Health Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Storage Card */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-white/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <HardDrive className="w-5 h-5" />
                      </span>
                      <h2 className="text-base font-bold text-slate-800 dark:text-white">Drive Storage</h2>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        health.storage.is_low_space
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}
                    >
                      {health.storage.is_low_space ? 'Low Disk Space' : 'Healthy'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Free Space</span>
                      <span className="font-bold text-slate-800 dark:text-white">{health.storage.free_formatted}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          health.storage.used_percentage > 85 ? 'bg-amber-500' : 'bg-indigo-600 dark:bg-indigo-500'
                        }`}
                        style={{ width: `${health.storage.used_percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
                      <span>
                        Used: {health.storage.used_formatted} ({health.storage.used_percentage}%)
                      </span>
                      <span>Total: {health.storage.total_formatted}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Database Vitality Card */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-white/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <Database className="w-5 h-5" />
                      </span>
                      <h2 className="text-base font-bold text-slate-800 dark:text-white">Database Vitality</h2>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Connected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50/80 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Database Size</p>
                      <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">
                        {health.database.total_size_formatted}
                      </p>
                    </div>
                    <div
                      onClick={() => setIsTableBreakdownOpen(true)}
                      className="bg-slate-50/80 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/20 cursor-pointer transition-all group"
                      title="Click to view full database tables breakdown"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                          Total Tables
                        </p>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5 group-hover:text-emerald-900 dark:group-hover:text-emerald-300">
                        {health.database.total_tables}
                      </p>
                    </div>
                    <div className="bg-slate-50/80 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Estimated Rows</p>
                      <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">
                        {Number(health.database.total_rows).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-50/80 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Active Threads</p>
                      <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">
                        {health.database.active_threads ?? 1}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-xs flex items-center justify-between gap-2">
                  <span className="text-slate-400 dark:text-slate-500 truncate">
                    Engine:{' '}
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">
                      MySQL {health.database.version}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsTableBreakdownOpen(true)}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200/60 dark:border-emerald-700/60 shrink-0"
                    title="Open Database Tables Breakdown"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>View Tables</span>
                  </button>
                </div>
              </div>

              {/* Server Environment Card */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-white/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Server className="w-5 h-5" />
                      </span>
                      <h2 className="text-base font-bold text-slate-800 dark:text-white">Environment</h2>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      PHP {health.server.php_version}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-sm mb-4">
                    <div className="flex justify-between py-1 border-b border-slate-100/80 dark:border-slate-700/80">
                      <span className="text-slate-500 dark:text-slate-400">Framework</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        Laravel {health.application.laravel_version}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100/80 dark:border-slate-700/80">
                      <span className="text-slate-500 dark:text-slate-400">Memory Limit</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {health.server.memory_limit}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100/80 dark:border-slate-700/80">
                      <span className="text-slate-500 dark:text-slate-400">Queue Driver</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 uppercase font-mono text-xs">
                        {health.application.queue_connection}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 dark:text-slate-400">Current RAM Use</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {health.server.current_memory_usage}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 truncate">
                  OS: <span className="text-slate-600 dark:text-slate-300">{health.server.os_description}</span>
                </div>
              </div>
            </div>

            {/* Automated Backup Schedule Configuration */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-white/80 dark:border-slate-700/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-700 gap-4">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-white">
                      Automated Backup Schedule
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Configure weekly or monthly automated snapshots during off-peak hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Strict Auto-Retention: 4 Backups Max
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmitSchedule} className="mt-6 space-y-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_enabled"
                    checked={scheduleForm.is_enabled}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({ ...prev, is_enabled: e.target.checked }))
                    }
                    className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:bg-slate-700"
                  />
                  <label htmlFor="is_enabled" className="text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                    Enable Automated Backups
                  </label>
                </div>

                <div
                  className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity ${
                    scheduleForm.is_enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
                  }`}
                >
                  {/* Frequency Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Frequency
                    </label>
                    <select
                      value={scheduleForm.frequency}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({
                          ...prev,
                          frequency: e.target.value as 'weekly' | 'monthly',
                        }))
                      }
                      className="w-full text-sm border-slate-200 dark:border-slate-600 rounded-xl focus:border-blue-500 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-900/50 dark:text-slate-200"
                    >
                      <option value="weekly">Weekly (Specific Day of Week)</option>
                      <option value="monthly">Monthly (Specific Date of Month)</option>
                    </select>
                  </div>

                  {/* Day Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      {scheduleForm.frequency === 'weekly' ? 'Day of the Week' : 'Day of the Month'}
                    </label>

                    {scheduleForm.frequency === 'weekly' ? (
                      <select
                        value={scheduleForm.day_of_week}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({
                            ...prev,
                            day_of_week: Number(e.target.value),
                          }))
                        }
                        className="w-full text-sm border-slate-200 dark:border-slate-600 rounded-xl focus:border-blue-500 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-900/50 dark:text-slate-200"
                      >
                        {daysOfWeek.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={scheduleForm.day_of_month}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({
                            ...prev,
                            day_of_month: Number(e.target.value),
                          }))
                        }
                        className="w-full text-sm border-slate-200 dark:border-slate-600 rounded-xl focus:border-blue-500 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-900/50 dark:text-slate-200"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}
                            {d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of every month
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Execution Time */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Execution Time (HH:MM, UTC+8)
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.execution_time}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({ ...prev, execution_time: e.target.value }))
                      }
                      className="w-full text-sm border-slate-200 dark:border-slate-600 rounded-xl focus:border-blue-500 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-900/50 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>Last executed: {formattedLastRun || 'Never'}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingSchedule}
                    className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSavingSchedule ? 'Saving...' : 'Save Schedule Settings'}
                  </button>
                </div>
              </form>
            </div>

            {/* Backup Archives Table (Max 4 slots) */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
              <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800 dark:text-white">
                      Retained Backup Archives
                    </h2>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      {completedBackupsCount} / 4 Retained
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Each archive packages the raw MySQL dump, system health report (.json & .md), and SHA-256 verification manifest.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-6">Archive Filename</th>
                      <th className="py-3 px-6">Date Created (UTC+8)</th>
                      <th className="py-3 px-6">File Size</th>
                      <th className="py-3 px-6">Triggered By</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                    {!backupHistories || backupHistories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                          <Database className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm font-medium">No backups created yet.</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Click "Create Backup Now" above to generate your first snapshot.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      backupHistories.map((backup) => (
                        <tr
                          key={backup.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="py-3.5 px-6 font-medium text-slate-800 dark:text-white">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="font-mono text-xs">{backup.filename}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300 text-xs">
                            <div>{backup.created_at}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">
                              {backup.created_at_relative}
                            </div>
                          </td>

                          <td className="py-3.5 px-6 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                            {backup.file_size_formatted || '—'}
                          </td>

                          <td className="py-3.5 px-6 text-xs text-slate-600 dark:text-slate-300">
                            {backup.triggered_by_name}
                          </td>

                          <td className="py-3.5 px-6">
                            {backup.status === 'completed' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Completed
                              </span>
                            )}
                            {(backup.status === 'running' || backup.status === 'pending') && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 animate-pulse">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Processing...
                              </span>
                            )}
                            {backup.status === 'failed' && (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                                title={backup.error_message || undefined}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Failed
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Download Button */}
                              {backup.status === 'completed' && (
                                <a
                                  href={`/system-health/backup/${backup.id}/download`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-200/60 dark:border-blue-700/60 shadow-sm"
                                  title="Download Backup ZIP"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </a>
                              )}

                              {/* Delete Button */}
                              {backup.status !== 'running' && backup.status !== 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => confirmDeleteBackup(backup)}
                                  className="inline-flex items-center p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                  title="Delete Archive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Backup Archive"
        message={`Are you sure you want to permanently delete archive '${backupToDelete?.filename}'? This action cannot be undone.`}
        confirmText="Delete Archive"
        confirmColor="rose"
        isProcessing={isDeleting}
        onConfirm={executeDeleteBackup}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setBackupToDelete(null);
        }}
      />

      {/* Database Tables Breakdown Modal */}
      <Modal
        show={isTableBreakdownOpen}
        onClose={() => setIsTableBreakdownOpen(false)}
        maxWidth="4xl"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </span>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Database Tables Breakdown
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                {health.database.total_tables} tables recorded via information_schema
              </span>
              <button
                type="button"
                onClick={() => setIsTableBreakdownOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search / filter bar */}
          <div className="mt-4 mb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                placeholder="Filter tables by name..."
                className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-xl focus:border-emerald-500 focus:ring-emerald-500 bg-slate-50/60 dark:bg-slate-900/50 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Tables Container */}
          <div className="border border-slate-200/80 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
            <div className="max-h-[460px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-5 text-left font-semibold">Table</th>
                    <th className="py-3 px-5 text-right font-semibold">Est. Rows</th>
                    <th className="py-3 px-5 text-right font-semibold">Data Size</th>
                    <th className="py-3 px-5 text-right font-semibold">Index Size</th>
                    <th className="py-3 px-5 text-right font-semibold">Total Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {filteredTables.map((table) => (
                    <tr
                      key={table.name}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="py-3 px-5 font-mono text-slate-700 dark:text-slate-200 text-xs">
                        {table.name}
                      </td>
                      <td className="py-3 px-5 text-right text-slate-600 dark:text-slate-400 text-xs font-normal">
                        {Number(table.rows).toLocaleString()}
                      </td>
                      <td className="py-3 px-5 text-right text-slate-600 dark:text-slate-400 text-xs font-normal">
                        {table.data_size_formatted}
                      </td>
                      <td className="py-3 px-5 text-right text-slate-600 dark:text-slate-400 text-xs font-normal">
                        {table.index_size_formatted}
                      </td>
                      <td className="py-3 px-5 text-right font-bold text-slate-900 dark:text-white text-xs">
                        {table.total_size_formatted}
                      </td>
                    </tr>
                  ))}

                  {filteredTables.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                        No database tables found matching "{tableSearchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer with summary and close button */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <span>
                Total Database Size:{' '}
                <strong className="text-slate-800 dark:text-white">
                  {health.database.total_size_formatted}
                </strong>
              </span>
              <span>
                Estimated Total Rows:{' '}
                <strong className="text-slate-800 dark:text-white">
                  {Number(health.database.total_rows).toLocaleString()}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsTableBreakdownOpen(false)}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
