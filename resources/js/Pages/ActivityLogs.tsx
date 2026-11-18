import { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Search, ArrowLeft, Clock, ArrowRight, ArrowLeft as ArrowLeftIcon, Activity } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import Header from '../Components/Header';
import ImpersonationBanner from '../Components/ImpersonationBanner';
import { ActivityLogsProps } from '../types';

export default function ActivityLogs() {
  const { logs, search, auth } = usePage<ActivityLogsProps>().props;
  const user = auth.user;

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [perPage, setPerPage] = useState(logs.per_page || 25);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/activity-logs', { search: searchTerm, per_page: perPage }, { preserveState: true });
  };

  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPerPage = Number(e.target.value);
    setPerPage(newPerPage);
    router.get('/activity-logs', { search: searchTerm, per_page: newPerPage }, { preserveState: true });
  };

  const getActionColor = (action: string) => {
    if (action.includes('created') || action.includes('login')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (action.includes('deleted') || action.includes('logout')) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (action.includes('updated')) return 'text-blue-600 bg-blue-50 border-blue-100';
    if (action.includes('impersonation')) return 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const getActionLabel = (action: string) => action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {isMobileOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
      )}

      {user.is_impersonating && <ImpersonationBanner user={user} />}

      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        user={user}
        currentView="activity_logs"
        onNavigate={(view) => {
          router.visit(view === 'dashboard' ? '/catalog' : `/catalog?view=${view}`);
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenMobile={() => setIsMobileOpen(true)} user={user} />

        <main className={`flex-1 overflow-y-auto relative ${user.is_impersonating ? 'mt-10' : ''} p-6`}>
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => router.visit('/catalog')} title="Back to Master Projects" className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-inner">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Activity Logs</h1>
                  <p className="text-slate-500 dark:text-slate-400">System-wide audit trail of all actions.</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <form onSubmit={handleSearch} className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" placeholder="Search actions or descriptions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                </form>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4 font-semibold">Timestamp</th>
                      <th className="p-4 font-semibold">User</th>
                      <th className="p-4 font-semibold">Action</th>
                      <th className="p-4 font-semibold">Description</th>
                      <th className="p-4 font-semibold">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {logs.data.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-500">No logs found.</td></tr>
                    ) : (
                      logs.data.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{new Date(log.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{log.user?.full_name || 'System'}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">@{log.user?.username || 'system'}</div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getActionColor(log.action)}`}>
                              {getActionLabel(log.action)}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-400 max-w-md">{log.description}</td>
                          <td className="p-4 text-xs font-mono text-slate-400 dark:text-slate-500">{log.ip_address}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {logs.data.length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Show</span>
                    <select
                      value={perPage}
                      onChange={handlePerPageChange}
                      className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm py-1 pl-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>entries</span>
                  </div>
                  <div>
                    Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{logs.from || 0}</span> to <span className="font-semibold text-slate-900 dark:text-slate-100">{logs.to || 0}</span> of <span className="font-semibold text-slate-900 dark:text-slate-100">{logs.total}</span> entries
                  </div>
                  <div className="flex items-center gap-1">
                    {logs.links.map((link, i) => {
                      if (!link.url && link.label.includes('Previous')) {
                        return (
                          <button key={i} disabled className="p-1.5 rounded text-slate-300 dark:text-slate-600 cursor-not-allowed">
                            <ArrowLeftIcon className="w-5 h-5" />
                          </button>
                        );
                      }
                      if (!link.url && link.label.includes('Next')) {
                        return (
                          <button key={i} disabled className="p-1.5 rounded text-slate-300 dark:text-slate-600 cursor-not-allowed">
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        );
                      }

                      // Check if link is prev/next
                      if (link.label.includes('Previous')) {
                        return (
                          <button key={i} onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            <ArrowLeftIcon className="w-5 h-5" />
                          </button>
                        );
                      }
                      
                      if (link.label.includes('Next')) {
                        return (
                          <button key={i} onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        );
                      }

                      // Page numbers
                      return (
                        <button key={i} onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                          disabled={!link.url || link.active}
                          className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                            ${link.active ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}
                            ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {link.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
