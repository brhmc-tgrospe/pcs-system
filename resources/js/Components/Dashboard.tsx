import { useState } from 'react';
import { 
  PackageSearch, Boxes, Tags, AlertCircle, ArrowUpRight, Activity, 
  Layers, LayoutDashboard, Trophy 
} from 'lucide-react';
import { Item, Category, ActivityLogEntry, AuthUser } from '../types';
import ActivityLogsModal from './ActivityLogsModal';
import StatDetailsModal from './StatDetailsModal';
import ActivityLogItem from './ActivityLogItem';

interface DashboardProps {
  items: Item[];
  categories: Category[];
  recentLogs: ActivityLogEntry[];
  onNavigate: (view: string) => void;
  user: AuthUser;
  onViewItem?: (item: Item) => void;
}

export default function Dashboard({ items, categories, recentLogs, onNavigate, user, onViewItem }: DashboardProps) {
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [activeStat, setActiveStat] = useState<{ title: string; data: any[]; type: 'items' | 'categories' } | null>(null);

  const archivedItems = items.filter(item => item.deleted_at !== null);
  const activeItems = items.filter(item => item.deleted_at === null);
  const activeCategories = categories.filter(category => category.deleted_at === null);
  const awardedItems = activeItems.filter(item => item.status === 'Awarded');

  const stats = [
    {
      label: 'Project Items',
      value: activeItems.length.toLocaleString(),
      icon: Boxes,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60',
      rawData: activeItems,
      type: 'items' as const
    },
    {
      label: 'Awarded Items',
      value: awardedItems.length.toLocaleString(),
      icon: Trophy,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60',
      rawData: awardedItems,
      type: 'items' as const
    },
    {
      label: 'Active Categories',
      value: activeCategories.length.toLocaleString(),
      icon: Tags,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60',
      rawData: activeCategories,
      type: 'categories' as const
    },
    {
      label: 'Total Projects Value',
      value: '₱' + activeItems.reduce((sum, item) => sum + (Number(item.abc) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      icon: PackageSearch,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60',
      rawData: activeItems,
      type: 'items' as const
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto h-full overflow-y-auto flex flex-col gap-5 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/70 text-blue-600 dark:text-blue-400 rounded-xl">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              PCS Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Procurement Project System overview, awarded contracts, and live activity feed.
            </p>
          </div>
        </div>

        {/* Developer Archived Items quick-access badge */}
        {Boolean(user.can?.force_delete) && archivedItems.length > 0 && (
          <button
            onClick={() => setActiveStat({ title: 'Archived Items', data: archivedItems, type: 'items' })}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/70 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer self-start sm:self-auto"
            title="View archived items"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{archivedItems.length} Archived {archivedItems.length === 1 ? 'Item' : 'Items'}</span>
          </button>
        )}
      </div>

      {/* Stats Cards Grid (Even 4-column layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              onClick={() => setActiveStat({ title: stat.label, data: stat.rawData, type: stat.type })}
              className="bg-white dark:bg-slate-800/95 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div 
                  className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 p-1.5 rounded-lg group-hover:bg-slate-100 dark:group-hover:bg-slate-700/60 transition-colors"
                  title="View full list"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid: Balanced 50/50 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-[440px]">
        {/* Recent Activity Card */}
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 overflow-hidden flex flex-col h-full min-h-[440px]">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activity Log</h2>
            </div>
            <button
              onClick={() => setShowLogsModal(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer"
            >
              Show All Activity
            </button>
          </div>
          {recentLogs.length === 0 ? (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400 py-12 flex-1 flex flex-col items-center justify-center">
              <Boxes className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {recentLogs.map(log => (
                  <ActivityLogItem key={log.id} log={log} />
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Category Breakdown Card */}
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 overflow-hidden flex flex-col h-full min-h-[440px]">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Category Breakdown</h2>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              {activeCategories.length} Categories
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            <ul className="space-y-1.5">
              {activeCategories.map(cat => (
                <li
                  key={cat.id}
                  className="px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-xl transition-colors group border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                    <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {cat.name}
                    </span>
                  </div>
                  <span className="bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-md text-[11px] font-semibold shrink-0 border border-slate-200/50 dark:border-slate-600/50">
                    {cat.items_count} items
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {showLogsModal && (
        <ActivityLogsModal onClose={() => setShowLogsModal(false)} />
      )}

      <StatDetailsModal
        isOpen={!!activeStat}
        onClose={() => setActiveStat(null)}
        title={activeStat?.title || ''}
        data={activeStat?.data || []}
        type={activeStat?.type || 'items'}
        onViewItem={onViewItem}
      />
    </div>
  );
}
