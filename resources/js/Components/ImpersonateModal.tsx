import { useState } from 'react';
import { router } from '@inertiajs/react';
import { X, Search, UserCheck, ShieldCheck } from 'lucide-react';
import { UserSummary } from '../types';

interface ImpersonateModalProps {
  users: UserSummary[];
  onClose: () => void;
}

export default function ImpersonateModal({ users, onClose }: ImpersonateModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImpersonate = (userId: number) => {
    router.post(`/impersonate/${userId}`, {}, {
      onSuccess: () => onClose()
    });
  };

  const getRoleBadge = (role: string) => {
    if (role === 'developer') return 'bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200/60 dark:border-fuchsia-800/60';
    if (role === 'administrator') return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60';
    return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Impersonate User
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Test permissions and views as another user account.
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

        {/* Search */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, username, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-slate-500 text-xs py-8">No users found matching your search.</p>
          ) : (
            <ul className="space-y-1">
              {filteredUsers.map(u => (
                <li key={u.id}>
                  <button
                    onClick={() => handleImpersonate(u.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-fuchsia-50/80 dark:hover:bg-fuchsia-950/30 hover:border-fuchsia-200 dark:hover:border-fuchsia-800 border border-transparent transition-all group text-left cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-fuchsia-700 dark:group-hover:text-fuchsia-300">
                        {u.full_name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px]">@{u.username}</span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                        <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold border capitalize ${getRoleBadge(u.role)}`}>
                          {u.role}
                        </span>
                      </div>
                    </div>
                    <UserCheck className="w-4 h-4 text-slate-300 group-hover:text-fuchsia-500 transition-colors" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
