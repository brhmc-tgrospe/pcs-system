import { Clock } from 'lucide-react';
import { ActivityLogEntry } from '../types';
import { getActionLabel } from '../utils';

interface ActivityLogItemProps {
  log: ActivityLogEntry;
}

export default function ActivityLogItem({ log }: ActivityLogItemProps) {
  return (
    <li className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
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
        <p className="text-sm text-slate-500 dark:text-slate-400 break-words line-clamp-2">{log.description}</p>
      </div>
      <span className="text-xs text-slate-400 shrink-0">
        {new Date(log.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </span>
    </li>
  );
}
