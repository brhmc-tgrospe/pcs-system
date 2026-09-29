import { useState } from 'react';
import { usePage, useForm, router } from '@inertiajs/react';
import { Monitor, Save, Globe } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import Header from '../Components/Header';
import ImpersonationBanner from '../Components/ImpersonationBanner';
import Toast from '../Components/Toast';
import { useDarkMode } from '../Components/DarkModeContext';
import SignatoriesSettings from '../Components/SignatoriesSettings';
import { AuthUser, UserSummary, Signatory } from '../types';

interface SettingsProps {
  auth: { user: AuthUser };
  users?: UserSummary[];
  signatories?: Signatory[];
}

export default function Settings({ auth, users, signatories = [] }: SettingsProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isDark, toggle: toggleDarkMode } = useDarkMode();

  const settingsForm = useForm({
    default_view: 'dashboard',
    compact_mode: false,
    dark_mode: isDark,
  });

  const submitSettings = (e: React.FormEvent) => {
    e.preventDefault();
    settingsForm.post('/settings', {
      preserveScroll: true,
    });
  };

  const handleDarkModeToggle = (checked: boolean) => {
    settingsForm.setData('dark_mode', checked);
    toggleDarkMode();
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Toast />
      
      {isMobileOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
      )}
      <Sidebar isMobileOpen={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} user={auth.user} currentView="settings" onNavigate={(view) => router.visit('/catalog')} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {auth.user.is_impersonating && <ImpersonationBanner user={auth.user} />}
        <Header onOpenMobile={() => setIsMobileOpen(true)} user={auth.user} users={users} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">System Settings</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Configure application preferences and features.</p>
            </div>

            <form onSubmit={submitSettings} className="space-y-8">
              {/* General Settings */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-3">
                  <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">General Preferences</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Default View</label>
                      <select
                        value={settingsForm.data.default_view}
                        onChange={e => settingsForm.setData('default_view', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                        required
                      >
                        <option value="dashboard">Dashboard</option>
                        <option value="catalog">Master Projects</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interface Options */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Interface Options</h2>
                </div>
                <div className="p-6 space-y-6">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={settingsForm.data.compact_mode}
                        onChange={e => settingsForm.setData('compact_mode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Compact Tables Mode</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Reduce padding in tables to show more data at once.</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={settingsForm.data.dark_mode}
                        onChange={e => handleDarkModeToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Dark Mode</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Enable dark theme across the application.</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={settingsForm.processing}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" /> Save Settings
                </button>
              </div>
            </form>

            {/* Official Report Signatories (Admin & Developer) */}
            <SignatoriesSettings signatories={signatories} user={auth.user} />
          </div>
        </main>
      </div>
    </div>
  );
}
