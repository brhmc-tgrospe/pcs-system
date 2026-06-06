import { useState, useEffect } from 'react';
import { X, Clock, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { ActivityLogEntry } from '../types';

interface ActivityLogsModalProps {
  onClose: () => void;
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    item_created: 'Item Created',
    item_updated: 'Item Updated',
    item_deleted: 'Item Deleted',
    category_created: 'Category Created',
    category_updated: 'Category Updated',
    category_deleted: 'Category Deleted',
    login: 'User Login',
    logout: 'User Logout',
    report_printed: 'Report Printed',
    impersonation_started: 'Impersonation Started',
    impersonation_ended: 'Impersonation Ended',
    user_created: 'User Created',
    user_updated: 'User Updated',
    user_deleted: 'User Deleted',
  };
  return labels[action] || action.replace(/_/g, ' ');
}

export default function ActivityLogsModal({ onClose }: ActivityLogsModalProps) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async (pageNumber: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/activity-logs?page=${pageNumber}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      const data = await res.json();
      setLogs(data.data);
      setLastPage(data.last_page);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            All Recent Activity
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">No activity recorded yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {logs.map(log => (
                <li key={log.id} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{getActionLabel(log.action)}</span>
                      {log.user && (
                        <span className="text-xs text-slate-400">by {log.user.username}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 break-words">{log.description}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {new Date(log.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{logs.length}</span> of <span className="font-semibold text-slate-900 dark:text-white">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Page {page} of {lastPage}
            </span>
            <button
              onClick={() => setPage(p => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
