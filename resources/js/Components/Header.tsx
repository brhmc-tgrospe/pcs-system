import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Menu, LogOut, Search, Users, User, Settings as SettingsIcon, Command } from 'lucide-react';
import { AuthUser, UserSummary } from '../types';
import ImpersonateModal from './ImpersonateModal';
import CommandPalette from './CommandPalette';

interface HeaderProps {
  onOpenMobile: () => void;
  user: AuthUser;
  users?: UserSummary[];
}

export default function Header({ onOpenMobile, user, users }: HeaderProps) {
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Global keyboard shortcut listener for Ctrl+K / Cmd+K and '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
        return;
      }

      // '/' when focus is not inside an editable element
      if (e.key === '/' && !isPaletteOpen) {
        const target = e.target as HTMLElement | null;
        const tagName = target?.tagName?.toUpperCase();
        const isEditable = target?.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';

        if (!isEditable) {
          e.preventDefault();
          setIsPaletteOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaletteOpen]);

  const handleLogout = () => {
    router.post('/logout');
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0 shadow-xs transition-colors duration-300">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onOpenMobile}
            className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Search Button */}
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Quick search portal (Ctrl+K)"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Desktop Command Palette Trigger Button */}
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="hidden md:flex items-center gap-2.5 pl-3 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 w-64 lg:w-72 transition-all cursor-pointer shadow-2xs group text-left"
            title="Open command palette (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0" />
            <span className="flex-1 text-xs sm:text-sm truncate">Search or jump to...</span>
            <div className="flex items-center gap-1 shrink-0">
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 shadow-2xs">
                Ctrl K
              </kbd>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {Boolean(user.can?.impersonate) && !user.is_impersonating && users && (
            <button
              onClick={() => setShowImpersonateModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-50 dark:bg-fuchsia-900/30 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/50 border border-fuchsia-200 dark:border-fuchsia-700 rounded-lg transition-colors cursor-pointer"
              title="Developer Action: Impersonate User"
            >
              <Users className="w-4 h-4" />
              Impersonate
            </button>
          )}

          <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-700 sm:border-none sm:pl-0 relative group cursor-pointer">
            <div className="hidden sm:block text-right pr-2">
              <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {user.full_name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold border-2 border-white dark:border-slate-800 shadow-xs">
              {user.first_name[0]}{user.last_name[0]}
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 sm:hidden">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{user.full_name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</div>
              </div>
              <button
                onClick={() => router.get('/profile')}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" /> My Profile
              </button>
              <button
                onClick={() => router.get('/settings')}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4" /> Settings
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        user={user}
        onOpenImpersonate={() => setShowImpersonateModal(true)}
      />

      {showImpersonateModal && users && (
        <ImpersonateModal
          users={users}
          onClose={() => setShowImpersonateModal(false)}
        />
      )}
    </>
  );
}

