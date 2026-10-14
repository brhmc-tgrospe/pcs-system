import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { 
  Database, 
  Download, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  HardDrive, 
  ShieldCheck,
  FileArchive,
  ArrowRight,
  Layers,
  Search,
  X
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { BackupArchive, BackupSchedule, BackupStatus, DatabaseTableBreakdown } from '../types';

interface DeveloperBackupSectionProps {
  initialBackups?: BackupArchive[];
  initialSchedule?: BackupSchedule;
  initialStatus?: BackupStatus;
  initialHealth?: any;
}

export default function DeveloperBackupSection({
  initialBackups = [],
  initialSchedule = {
    frequency: 'weekly',
    day: 0,
    time: '02:00',
    is_enabled: true,
  },
  initialStatus = {
    status: 'idle',
    progress_percent: 0,
    step_message: 'Idle',
    filename: null,
    error_message: null,
  },
  initialHealth,
}: DeveloperBackupSectionProps) {
  const [backups, setBackups] = useState<BackupArchive[]>(initialBackups);
  const [schedule, setSchedule] = useState<BackupSchedule>(initialSchedule);
  const [status, setStatus] = useState<BackupStatus>(initialStatus);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [deletingFilename, setDeletingFilename] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTablesModalOpen, setIsTablesModalOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  // Close tables breakdown modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTablesModalOpen) {
        setIsTablesModalOpen(false);
      }
    };
    if (isTablesModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTablesModalOpen]);

  // Sync state if props change
  useEffect(() => {
    setBackups(initialBackups);
  }, [initialBackups]);

  useEffect(() => {
    if (initialSchedule) {
      setSchedule(initialSchedule);
    }
  }, [initialSchedule]);

  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus);
    }
  }, [initialStatus]);

  // Real-time polling while backup job is running
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (status.status === 'running') {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/developer/backups/status', {
            headers: { Accept: 'application/json' },
          });
          if (res.ok) {
            const data: BackupStatus = await res.json();
            setStatus(data);

            if (data.status === 'completed' || data.status === 'failed') {
              // Refresh backup list when finished
              router.reload({ only: ['backups', 'backupStatus', 'backupSchedule', 'systemHealth'] });
            }
          }
        } catch (e) {
          console.error('Failed to poll backup status', e);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status.status]);

  const handleTriggerBackup = () => {
    if (status.status === 'running' || isTriggering) return;

    setIsTriggering(true);
    setStatus(prev => ({
      ...prev,
      status: 'running',
      progress_percent: 15,
      step_message: 'Generating system backup and health diagnostics...',
    }));

    router.post(
      '/developer/backups/trigger',
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          router.reload({ only: ['backups', 'backupStatus', 'backupSchedule', 'systemHealth'] });
        },
        onError: () => {
          setStatus(prev => ({
            ...prev,
            status: 'failed',
            error_message: 'Backup generation failed.',
          }));
        },
        onFinish: () => {
          setIsTriggering(false);
        },
      }
    );
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSchedule(true);

    router.put(
      '/developer/backups/schedule',
      {
        frequency: schedule.frequency,
        day: Number(schedule.day),
        time: schedule.time,
        is_enabled: Boolean(schedule.is_enabled),
      },
      {
        preserveScroll: true,
        onFinish: () => {
          setIsSavingSchedule(false);
        },
      }
    );
  };

  const confirmDelete = (filename: string) => {
    setDeletingFilename(filename);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (!deletingFilename) return;

    setIsDeleting(true);
    router.delete(`/developer/backups/${deletingFilename}`, {
      preserveScroll: true,
      onSuccess: () => {
        setBackups(prev => prev.filter(b => b.filename !== deletingFilename));
        setIsDeleteModalOpen(false);
        setDeletingFilename(null);
      },
      onFinish: () => {
        setIsDeleting(false);
      },
    });
  };

  const dayOfWeekNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const databaseTables: DatabaseTableBreakdown[] = initialHealth?.database?.tables || [];
  const filteredTables = databaseTables.filter(t =>
    t.table.toLowerCase().includes(tableSearch.trim().toLowerCase())
  );

  const formatRowBytes = (bytes?: number, fallbackMb?: number): string => {
    if (typeof bytes === 'number' && bytes >= 0) {
      if (bytes >= 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      }
      return Math.round(bytes / 1024) + ' KB';
    }
    if (typeof fallbackMb === 'number') {
      if (fallbackMb >= 1) {
        return fallbackMb.toFixed(1) + ' MB';
      }
      return Math.round(fallbackMb * 1024) + ' KB';
    }
    return '0 KB';
  };

  return (
    <div id="system-health-section" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden scroll-mt-6">
      {/* Header Banner */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-800 dark:to-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Database & System Health Backups
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                Developer Only
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Zero-locking MySQL dumps bundled with deep diagnostics. Strictly retains the latest 4 snapshots.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTriggerBackup}
          disabled={status.status === 'running' || isTriggering}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 ${
            status.status === 'running' || isTriggering
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-indigo-200 dark:shadow-none'
          }`}
        >
          <RefreshCw
            className={`w-4 h-4 ${
              status.status === 'running' || isTriggering ? 'animate-spin' : ''
            }`}
          />
          {status.status === 'running' ? 'Backing Up...' : 'Run Backup Now'}
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Active Progress Alert */}
        {status.status === 'running' && (
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/30 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                {status.step_message || 'Processing system backup...'}
              </span>
              <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                {status.progress_percent}%
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(status.progress_percent, 5)}%` }}
              />
            </div>
          </div>
        )}

        {/* Failed Status Alert */}
        {status.status === 'failed' && (
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-rose-900 dark:text-rose-200">Last Backup Failed</p>
              <p className="text-rose-700 dark:text-rose-400 mt-0.5">
                {status.error_message || 'An unknown error occurred during backup generation.'}
              </p>
            </div>
          </div>
        )}

        {/* Live System Health Diagnostic Snapshot */}
        {initialHealth && (
          <div className="border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 bg-gradient-to-br from-slate-50/70 to-slate-100/40 dark:from-slate-800/60 dark:to-slate-800/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Live System Health & Telemetry
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  UTC+8
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Host: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{initialHealth.host?.hostname}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">PHP Runtime</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">PHP {initialHealth.host?.php_version}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Limit: {initialHealth.host?.memory_limit}</div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">MySQL Database</span>
                    <button
                      type="button"
                      onClick={() => setIsTablesModalOpen(true)}
                      title="View database tables breakdown"
                      className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-0.5 rounded cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{initialHealth.database?.total_size_mb} MB</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{initialHealth.database?.tables_count} Tables ({initialHealth.database?.database_name})</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTablesModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline cursor-pointer text-left"
                >
                  <span>View tables breakdown &rarr;</span>
                </button>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Disk Storage</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{initialHealth.storage?.disk_free_gb} GB Free</div>
                <div className="text-[11px] text-slate-400 mt-0.5">of {initialHealth.storage?.disk_total_gb} GB Total</div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Queue Workers</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{initialHealth.queue_and_jobs?.driver || 'database'}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{initialHealth.queue_and_jobs?.pending_jobs} Pending • {initialHealth.queue_and_jobs?.failed_jobs} Failed</div>
              </div>
            </div>
          </div>
        )}

        {/* Automated Schedule Configuration Card */}
        <div className="border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Automated Background Schedule
              </h3>
            </div>
            {schedule.last_run_at && (
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Last automated run: {new Date(schedule.last_run_at).toLocaleString()} (
                {schedule.last_status === 'success' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Success</span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">Failed</span>
                )}
                )
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSchedule} className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                id="is_enabled"
                type="checkbox"
                checked={schedule.is_enabled}
                onChange={e => setSchedule(prev => ({ ...prev, is_enabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
              />
              <label htmlFor="is_enabled" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                Enable automated background backups
              </label>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 ${!schedule.is_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Frequency */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Cadence
                </label>
                <select
                  value={schedule.frequency}
                  onChange={e => {
                    const freq = e.target.value as 'weekly' | 'monthly';
                    setSchedule(prev => ({
                      ...prev,
                      frequency: freq,
                      day: freq === 'weekly' ? 0 : 1,
                    }));
                  }}
                  className="w-full text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Day */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {schedule.frequency === 'weekly' ? 'Day of the Week' : 'Day of the Month'}
                </label>
                {schedule.frequency === 'weekly' ? (
                  <select
                    value={schedule.day}
                    onChange={e => setSchedule(prev => ({ ...prev, day: Number(e.target.value) }))}
                    className="w-full text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {dayOfWeekNames.map((dayName, idx) => (
                      <option key={idx} value={idx}>
                        {dayName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={schedule.day}
                    onChange={e => setSchedule(prev => ({ ...prev, day: Number(e.target.value) }))}
                    className="w-full text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>
                        {day}
                        {day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of month
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Execution Time (UTC+8)
                </label>
                <input
                  type="time"
                  value={schedule.time}
                  onChange={e => setSchedule(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingSchedule}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isSavingSchedule ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </form>
        </div>

        {/* Retained Backups Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-500" />
              Retained Backup Archives ({backups.length}/4)
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Auto-pruning kicks in when count reaches 5
            </span>
          </div>

          {backups.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
              <FileArchive className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                No backup archives found yet
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Click &quot;Run Backup Now&quot; above to generate your first snapshot.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-5 py-3.5">Archive Filename</th>
                      <th className="px-5 py-3.5">Created (UTC+8)</th>
                      <th className="px-5 py-3.5">File Size</th>
                      <th className="px-5 py-3.5">Health State</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                    {backups.map((b, idx) => (
                      <tr
                        key={b.filename}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <FileArchive className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>{b.filename}</span>
                          {idx === 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                              Latest
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 text-xs">
                          <div>{b.created_at_human}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {b.created_at_formatted || new Date(b.created_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {b.size_formatted}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                            <ShieldCheck className="w-3 h-3 text-blue-500" />
                            Dump + Health
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <a
                            href={`/developer/backups/${b.filename}/download`}
                            download={b.filename}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                          <button
                            type="button"
                            onClick={() => confirmDelete(b.filename)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Backup Archive"
        message={`Are you sure you want to permanently delete "${deletingFilename}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingFilename(null);
        }}
        isProcessing={isDeleting}
        confirmText="Delete Backup"
        confirmColor="rose"
        Icon={Trash2}
      />

      {/* Database Tables Breakdown Modal */}
      {isTablesModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTablesModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tables-breakdown-title"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 id="tables-breakdown-title" className="text-lg font-bold text-slate-900 dark:text-white">
                  Database Tables Breakdown
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">
                  {databaseTables.length} tables recorded via information_schema
                </span>
                <button
                  type="button"
                  onClick={() => setIsTablesModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Optional Table Filter */}
            {databaseTables.length > 5 && (
              <div className="relative shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  placeholder="Filter tables..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            )}

            {/* Table Container */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col min-h-0 bg-white dark:bg-slate-900">
              <div className="overflow-y-auto max-h-[60vh]">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 bg-[#f8fafc] dark:bg-slate-800/95 border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th scope="col" className="py-3 px-5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Table
                      </th>
                      <th scope="col" className="py-3 px-5 text-sm font-semibold text-slate-700 dark:text-slate-200 text-right">
                        Est. Rows
                      </th>
                      <th scope="col" className="py-3 px-5 text-sm font-semibold text-slate-700 dark:text-slate-200 text-right">
                        Data Size
                      </th>
                      <th scope="col" className="py-3 px-5 text-sm font-semibold text-slate-700 dark:text-slate-200 text-right">
                        Index Size
                      </th>
                      <th scope="col" className="py-3 px-5 text-sm font-semibold text-slate-700 dark:text-slate-200 text-right">
                        Total Size
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {filteredTables.length > 0 ? (
                      filteredTables.map((t) => (
                        <tr
                          key={t.table}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3.5 px-5 font-mono text-sm text-slate-700 dark:text-slate-300">
                            {t.table}
                          </td>
                          <td className="py-3.5 px-5 text-sm text-slate-600 dark:text-slate-400 text-right">
                            {t.rows.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-5 text-sm text-slate-600 dark:text-slate-400 text-right">
                            {t.data_size_formatted || formatRowBytes(t.data_bytes, t.data_mb)}
                          </td>
                          <td className="py-3.5 px-5 text-sm text-slate-600 dark:text-slate-400 text-right">
                            {t.index_size_formatted || formatRowBytes(t.index_bytes, t.index_mb)}
                          </td>
                          <td className="py-3.5 px-5 text-sm font-bold text-slate-900 dark:text-white text-right">
                            {t.total_size_formatted || formatRowBytes(t.total_bytes, t.size_mb)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                        >
                          {tableSearch ? 'No tables match your filter.' : 'No table metrics recorded.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Sorted by Total Size (descending)
              </span>
              <button
                type="button"
                onClick={() => setIsTablesModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
