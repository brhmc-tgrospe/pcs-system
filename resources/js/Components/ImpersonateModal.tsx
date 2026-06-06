import { useState } from 'react';
import { router } from '@inertiajs/react';
import { X, Search, UserCheck } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Impersonate User</h3>
            <p className="text-xs text-slate-500 mt-0.5">Test permissions as another account.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, username, or role..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No users found.</p>
          ) : (
            <ul className="space-y-1">
              {filteredUsers.map(u => (
                <li key={u.id}>
                  <button
                    onClick={() => handleImpersonate(u.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-fuchsia-50 hover:text-fuchsia-700 transition-colors group text-left border border-transparent hover:border-fuchsia-100"
                  >
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-fuchsia-900">{u.full_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>@{u.username}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="capitalize font-medium">{u.role}</span>
                      </div>
                    </div>
                    <UserCheck className="w-5 h-5 text-slate-300 group-hover:text-fuchsia-500" />
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
