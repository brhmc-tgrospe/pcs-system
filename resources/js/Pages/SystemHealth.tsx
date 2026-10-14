import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Activity, ShieldAlert } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import Header from '../Components/Header';
import ImpersonationBanner from '../Components/ImpersonationBanner';
import Toast from '../Components/Toast';
import DeveloperBackupSection from '../Components/DeveloperBackupSection';
import { AuthUser, UserSummary, BackupArchive, BackupSchedule, BackupStatus } from '../types';

interface SystemHealthProps {
  auth: { user: AuthUser };
  users?: UserSummary[];
  backups?: BackupArchive[];
  backupSchedule?: BackupSchedule;
  backupStatus?: BackupStatus;
  systemHealth?: any;
}

export default function SystemHealth({
  auth,
  users,
  backups = [],
  backupSchedule,
  backupStatus,
  systemHealth,
}: SystemHealthProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // If user is not developer, show unauthorized gate
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

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
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
        onNavigate={() => router.visit('/catalog')}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {auth.user.is_impersonating && <ImpersonationBanner user={auth.user} />}
        <Header onOpenMobile={() => setIsMobileOpen(true)} user={auth.user} users={users} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    System Health & Backups
                  </h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                  Live environment telemetry, storage footprint analysis, automated schedules, and database downloads.
                </p>
              </div>
            </div>

            <DeveloperBackupSection
              initialBackups={backups}
              initialSchedule={backupSchedule}
              initialStatus={backupStatus}
              initialHealth={systemHealth}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
