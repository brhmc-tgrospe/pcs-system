import { useState } from 'react';
import { PackageSearch, Boxes, Tags, AlertCircle, ArrowUpRight, Activity, Clock, Layers } from 'lucide-react';
import { Item, Category, ActivityLogEntry, AuthUser } from '../types';
import ActivityLogsModal from './ActivityLogsModal';
import StatDetailsModal from './StatDetailsModal';

interface DashboardProps {
  items: Item[];
  categories: Category[];
  recentLogs: ActivityLogEntry[];
  onNavigate: (view: string) => void;
  user: AuthUser;
}

import ActivityLogItem from './ActivityLogItem';
export default function Dashboard({ items, categories, recentLogs, onNavigate, user }: DashboardProps) {
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [activeStat, setActiveStat] = useState<{ title: string; data: any[]; type: 'items' | 'categories' } | null>(null);
  
  const archivedItems = items.filter(item => item.deleted_at !== null);
  const activeItems = items.filter(item => item.deleted_at === null);
  const activeCategories = categories.filter(category => category.deleted_at === null);

  const stats = [
    { label: 'Total Catalog Items', value: activeItems.length.toString(), icon: Boxes, color: 'text-blue-600', bg: 'bg-blue-100', rawData: activeItems, type: 'items' as const },
    { label: 'Active Categories', value: activeCategories.length.toString(), icon: Tags, color: 'text-indigo-600', bg: 'bg-indigo-100', rawData: activeCategories, type: 'categories' as const },
    { label: 'Total Catalog Value', value: '₱' + activeItems.reduce((sum, item) => sum + (Number(item.abc) || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 2 }), icon: PackageSearch, color: 'text-emerald-600', bg: 'bg-emerald-100', rawData: activeItems, type: 'items' as const },
    { label: 'Archived Items', value: archivedItems.length.toString(), icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100', rawData: archivedItems, type: 'items' as const },
  ];

  const visibleStats = stats.filter(stat => stat.label !== 'Archived Items' || user.role === 'developer');

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">PCS Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Welcome to the Procurement Catalog System.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {visibleStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => setActiveStat({ title: stat.label, data: stat.rawData, type: stat.type })}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer transition-colors"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[500px]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h2>
            </div>
            <button
              onClick={() => setShowLogsModal(true)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Show All
            </button>
          </div>
          {recentLogs.length === 0 ? (
            <div className="p-6 text-center text-slate-500 py-12 flex-1">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p>No activity recorded yet.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {recentLogs.map(log => (
                <ActivityLogItem key={log.id} log={log} />
              ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[500px]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Category Breakdown</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {activeCategories.map(cat => (
                <li key={cat.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{cat.name}</span>
                  </div>
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded text-xs font-bold">
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
