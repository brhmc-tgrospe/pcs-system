import { useState, useEffect } from 'react';
import { X, Clock, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { ActivityLogEntry } from '../types';
import ActivityLogItem from './ActivityLogItem';

interface ActivityLogsModalProps {
  onClose: () => void;
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Audit Activity Logs
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {total} Events
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Complete history of system mutations, deletions, and additions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">Loading activity feed...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">No activity recorded yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {logs.map(log => (
                <ActivityLogItem key={log.id} log={log} />
              ))}
            </ul>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-900 dark:text-white">{logs.length}</span> of <span className="font-semibold text-slate-900 dark:text-white">{total}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {page} of {lastPage || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
