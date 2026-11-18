import { router, Link } from '@inertiajs/react';
import { LayoutDashboard, BookOpen, Settings, Boxes, Tags, FileBarChart, Users, Building, Activity, SlidersHorizontal, FileCheck } from 'lucide-react';
import { AuthUser } from '../types';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  user: AuthUser;
  currentView: string;
  onNavigate?: (view: string) => void;
}

function SidebarButton({ item, isActive, onNavigate }: { item: any, isActive: boolean, onNavigate: (view: string) => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onNavigate(item.id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
        ${isActive
          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-200' : 'text-slate-500 group-hover:text-slate-300'}`} />
      {item.label}
    </button>
  );
}

export default function Sidebar({ isMobileOpen, onCloseMobile, user, currentView, onNavigate }: SidebarProps) {
  const handleNavigate = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      router.visit(view === 'dashboard' ? '/catalog' : `/catalog?view=${view}`);
    }
  };

  const canManageItems = Boolean(user.can?.manage_items);
  const canManageCategories = Boolean(user.can?.manage_categories);
  const canManageBidders = Boolean(user.can?.manage_bidders);
  const canManageUsers = Boolean(user.can?.manage_users);
  const canViewLogs = Boolean(user.can?.view_logs);
  const canManageSettings = Boolean(user.can?.manage_settings);
  const isDeveloper = user.role === 'developer';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'catalog', label: 'Master Projects', icon: BookOpen },
    ...(canManageItems ? [{ id: 'manage_items', label: 'Manage Items', icon: Boxes }] : []),
    ...(canManageCategories ? [{ id: 'manage_categories', label: 'Categories', icon: Tags }] : []),
    ...(canManageBidders ? [{ id: 'bidders', label: 'Bidders', icon: Building, href: '/catalog/bidders' }] : []),
  ];

  const reportItems = [
    { id: 'print_report', label: 'Print Project Report', icon: FileBarChart },
    { id: 'saved_reports', label: 'Saved Reports', icon: FileCheck, href: '/saved-reports' },
    ...(canViewLogs ? [{ id: 'activity_logs', label: 'Activity Logs', icon: Settings, href: '/activity-logs' }] : []),
    ...(canManageUsers ? [{ id: 'users', label: 'Manage Users', icon: Users, href: '/users' }] : []),
    ...(isDeveloper ? [{ id: 'system_health', label: 'System Health', icon: Activity, href: '/system-health' }] : []),
    ...(canManageSettings ? [{ id: 'settings', label: 'Settings', icon: SlidersHorizontal, href: '/settings' }] : []),
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out border-r border-slate-800
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:static'}
      flex flex-col
    `}>
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <img src="/pcs-logo.png" alt="PCS Logo" className="w-8 h-8 object-contain rounded-lg shadow-sm" />
          <span className="text-xl font-black text-white tracking-tight">BRHMC - PCS</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">Project System</div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              if (item.href) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <Icon className="w-5 h-5 text-slate-500 group-hover:text-slate-300" />
                    {item.label}
                  </Link>
                );
              }
              return <SidebarButton key={item.id} item={item} isActive={isActive} onNavigate={handleNavigate} />;
            })}
          </nav>
        </div>

        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">Reports & Settings</div>
          <nav className="space-y-1">
            {reportItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              if (item.href) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-200' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    {item.label}
                  </Link>
                );
              }
              return <SidebarButton key={item.id} item={item} isActive={isActive} onNavigate={handleNavigate} />;
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
