import { useState } from 'react';
import { PackageSearch, Boxes, Tags, AlertCircle, ArrowUpRight, Activity, Clock, Layers, LayoutDashboard, PhilippinePeso } from 'lucide-react';
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
}

export default function Dashboard({ items, categories, recentLogs, onNavigate, user }: DashboardProps) {
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [activeStat, setActiveStat] = useState<{ title: string; data: any[]; type: 'items' | 'categories' } | null>(null);
  
  const archivedItems = items.filter(item => item.deleted_at !== null);
  const activeItems = items.filter(item => item.deleted_at === null);
  const activeCategories = categories.filter(category => category.deleted_at === null);

  const stats = [
    {
      label: 'Catalog Items',
      value: activeItems.length.toLocaleString(),
      icon: Boxes,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60',
      rawData: activeItems,
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
      label: 'Total Catalog Value',
      value: '₱' + activeItems.reduce((sum, item) => sum + (Number(item.abc) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      icon: PackageSearch,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60',
      rawData: activeItems,
      type: 'items' as const
    },
    {
      label: 'Archived Items',
      value: archivedItems.length.toLocaleString(),
      icon: AlertCircle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60',
      rawData: archivedItems,
      type: 'items' as const
    },
  ];

  const visibleStats = stats.filter(stat => stat.label !== 'Archived Items' || user.role === 'developer');

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
              Procurement Catalog System overview and live activity feed.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {visibleStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800/95 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <button 
                  onClick={() => setActiveStat({ title: stat.label, data: stat.rawData, type: stat.type })}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
                  title="View full list"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
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

      {/* Main Content Grid: Activity Feed & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Recent Activity Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/95 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 overflow-hidden flex flex-col min-h-[420px]">
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
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 overflow-hidden flex flex-col min-h-[420px]">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Category Breakdown</h2>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {activeCategories.length} categories
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            <ul className="space-y-1">
              {activeCategories.map(cat => (
                <li
                  key={cat.id}
                  className="px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                    <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {cat.name}
                    </span>
                  </div>
                  <span className="bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 border border-slate-200/50 dark:border-slate-600/50">
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
      />
    </div>
  );
}
