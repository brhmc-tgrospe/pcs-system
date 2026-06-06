import { useState, useEffect } from 'react';
import { usePage, router, useForm } from '@inertiajs/react';
import { Search, Plus, Edit2, Trash2, X, Check, ArrowLeft, ShieldAlert, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import Header from '../Components/Header';
import ImpersonationBanner from '../Components/ImpersonationBanner';
import Toast from '../Components/Toast';
import ConfirmationModal from '../Components/ConfirmationModal';
import { AuthUser, UserSummary } from '../types';

interface ManageUsersProps {
  users: UserSummary[];
  auth: { user: AuthUser };
}

type UserFormData = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role: 'user' | 'administrator' | 'developer';
};

export default function ManageUsers() {
  const { users, auth } = usePage<ManageUsersProps>().props;
  const user = auth.user;

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserSummary | null>(null);

  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'administrator' | 'developer'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, perPage]);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<UserFormData>({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'user',
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / perPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * perPage, currentPage * perPage);

  const openAddModal = () => {
    clearErrors();
    reset();
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserSummary) => {
    clearErrors();
    const parts = u.full_name.split(' ');
    const first_name = parts[0];
    const last_name = parts.slice(1).join(' ');
    setData({
      username: u.username,
      first_name,
      last_name,
      email: u.email,
      role: u.role,
      password: '',
    });
    setEditingUser(u);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      put(`/users/${editingUser.id}`, {
        preserveScroll: true,
        onSuccess: () => setIsModalOpen(false),
      });
    } else {
      post('/users', {
        preserveScroll: true,
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  const handleDelete = (u: UserSummary) => {
    if (u.id === user.id) {
      alert("You cannot delete yourself.");
      return;
    }
    setUserToDelete(u);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      router.delete(`/users/${userToDelete.id}`, { 
        preserveScroll: true,
        onSuccess: () => setIsDeleteModalOpen(false)
      });
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'developer') return 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200';
    if (role === 'administrator') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Toast />
      {isMobileOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
      )}

      {user.is_impersonating && <ImpersonationBanner user={user} />}

      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        user={user}
        currentView="users"
        onNavigate={(view) => {
          if (view !== 'users') router.visit('/catalog');
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenMobile={() => setIsMobileOpen(true)} user={user} />

        <main className={`flex-1 overflow-y-auto relative ${user.is_impersonating ? 'mt-10' : ''} p-6`}>
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-end mb-8">
              <div className="flex items-center gap-4">
                <button onClick={() => router.visit('/catalog')} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldAlert className="w-8 h-8 text-fuchsia-600" /> Manage Users
                  </h1>
                  <p className="text-slate-500">Add, edit, or remove portal users. Administrator access.</p>
                </div>
              </div>
              <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                <Plus className="w-5 h-5" /> Add User
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-slate-100 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="administrator">Administrator</option>
                    {user.role === 'developer' && <option value="developer">Developer</option>}
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-4 font-semibold">User</th>
                      <th className="p-4 font-semibold">Username</th>
                      <th className="p-4 font-semibold">Role</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {paginatedUsers.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500">No users found.</td></tr>
                    ) : (
                      paginatedUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{u.full_name}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{u.email}</div>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300 font-mono text-sm">@{u.username}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleBadge(u.role)} capitalize`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {user.role === 'administrator' && (u.role === 'administrator' || u.role === 'developer') ? (
                              <span className="text-xs text-slate-400 italic">Restricted</span>
                            ) : (
                              <>
                                <button onClick={() => openEditModal(u)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(u)} disabled={u.id === user.id} className="p-2 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Delete">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredUsers.length > 0 && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Show</span>
                    <select
                      value={perPage}
                      onChange={(e) => setPerPage(Number(e.target.value))}
                      className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>entries</span>
                  </div>
                  <div>
                    Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, filteredUsers.length)} of {filteredUsers.length} entries
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-2 font-medium">Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                    <input required type="text" value={data.first_name} onChange={e => setData('first_name', e.target.value)}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.first_name ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`} />
                    {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                    <input required type="text" value={data.last_name} onChange={e => setData('last_name', e.target.value)}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.last_name ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`} />
                    {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Username</label>
                  <input required type="text" value={data.username} onChange={e => setData('username', e.target.value)}
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm dark:text-white ${errors.username ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`} />
                  {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input required type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.email ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`} />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select required value={data.role} onChange={e => setData('role', e.target.value as UserFormData['role'])}
                    disabled={user.role === 'administrator'}
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize dark:text-white disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800 ${errors.role ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'}`}>
                    <option value="user">User</option>
                    {user.role === 'developer' && (
                      <>
                        <option value="administrator">Administrator</option>
                        <option value="developer">Developer</option>
                      </>
                    )}
                  </select>
                  {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password {editingUser && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>}
                  </label>
                  <input type="password" required={!editingUser} value={data.password} onChange={e => setData('password', e.target.value)}
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${errors.password ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`} />
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-end">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:text-slate-800 dark:hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit" form="user-form" disabled={processing}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60">
                <Check className="w-4 h-4" />
                {processing ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete User"
        message={`Are you sure you want to delete user "${userToDelete?.username}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isProcessing={processing}
        confirmText="Delete"
        confirmColor="rose"
      />
    </div>
  );
}
