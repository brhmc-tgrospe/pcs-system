import { useState, useEffect } from 'react';
import { usePage, router, useForm } from '@inertiajs/react';
import { Search, Plus, Edit2, Trash2, X, Check, ArrowLeft, ShieldAlert, ChevronLeft, ChevronRight, Filter, Users, UserCheck, Shield } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import Header from '../Components/Header';
import ImpersonationBanner from '../Components/ImpersonationBanner';
import Toast from '../Components/Toast';
import ConfirmationModal from '../Components/ConfirmationModal';
import ImpersonateModal from '../Components/ImpersonateModal';
import { AuthUser, UserSummary } from '../types';

interface ManageUsersProps extends Record<string, unknown> {
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
  const isDeveloper = user.role === 'developer';
  const canImpersonate = Boolean(user.can?.impersonate);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserSummary | null>(null);

  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'administrator' | 'developer'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
      window.history.replaceState({}, '', '/users');
    }
  }, []);

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
    setData({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'user',
    });
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserSummary) => {
    if (!isDeveloper && (u.role === 'administrator' || u.role === 'developer')) {
      return;
    }
    clearErrors();
    const parts = u.full_name.split(' ');
    const first_name = parts[0];
    const last_name = parts.slice(1).join(' ');
    setData({
      username: u.username,
      first_name,
      last_name,
      email: u.email,
      role: !isDeveloper ? 'user' : u.role,
      password: '',
    });
    setEditingUser(u);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeveloper) {
      data.role = 'user';
    }
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
    if (!isDeveloper && (u.role === 'administrator' || u.role === 'developer')) {
      return;
    }
    setUserToDelete(u);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      if (!isDeveloper && (userToDelete.role === 'administrator' || userToDelete.role === 'developer')) {
        setIsDeleteModalOpen(false);
        return;
      }
      router.delete(`/users/${userToDelete.id}`, { 
        preserveScroll: true,
        onSuccess: () => setIsDeleteModalOpen(false)
      });
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'developer') {
      return 'bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200/60 dark:border-fuchsia-800/60';
    }
    if (role === 'administrator') {
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60';
    }
    return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60';
  };

  const totalAdmins = users.filter(u => u.role === 'administrator' || u.role === 'developer').length;
  const totalStandard = users.filter(u => u.role === 'user').length;

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
        <Header onOpenMobile={() => setIsMobileOpen(true)} user={user} users={users} />

        <main className={`flex-1 overflow-y-auto relative ${user.is_impersonating ? 'mt-10' : ''} p-4 sm:p-6`}>
          <div className="max-w-7xl mx-auto h-full flex flex-col gap-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.visit('/catalog')}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                  title="Back to Master Projects"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 border border-violet-200/70 dark:border-violet-800/70 text-violet-600 dark:text-violet-400 rounded-xl shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Manage Users
                    </h1>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60">
                      {users.length} Total Users
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                      {totalAdmins} Admins
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                      {totalStandard} Standard
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Control access credentials, roles, and administrative permissions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {canImpersonate && !user.is_impersonating && (
                  <button
                    onClick={() => setIsImpersonateModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/50 border border-fuchsia-200 dark:border-fuchsia-800 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                    title="Impersonate User"
                  >
                    <UserCheck className="w-4 h-4" /> Impersonate
                  </button>
                )}
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add User
                </button>
              </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden min-h-0">
              {/* Toolbar */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto flex-1 max-w-xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search users by name, username, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-1.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm dark:text-slate-100 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                  </div>
                  <div className="relative w-full sm:w-44">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as any)}
                      className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="all">All Roles</option>
                      <option value="user">User</option>
                      <option value="administrator">Administrator</option>
                      {user.role === 'developer' && <option value="developer">Developer</option>}
                    </select>
                  </div>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium px-2 py-1"
                  >
                    Clear search
                  </button>
                )}
              </div>

              {/* Table Data */}
              <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-700">
                      <th className="py-2.5 px-3.5 font-semibold">User Details</th>
                      <th className="py-2.5 px-3.5 font-semibold w-48">Username</th>
                      <th className="py-2.5 px-3.5 font-semibold w-36">Role</th>
                      <th className="py-2.5 px-3.5 font-semibold w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm font-medium">No users found matching your query.</p>
                            {searchTerm && (
                              <button
                                onClick={() => setSearchTerm('')}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                              >
                                Reset search filter
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors group"
                        >
                          <td className="py-2.5 px-3.5">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                              {u.full_name}
                              {u.id === user.id && (
                                <span className="ml-2 text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                          </td>
                          <td className="py-2.5 px-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-600/70">
                              @{u.username}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getRoleBadge(
                                u.role
                              )}`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {canImpersonate && !user.is_impersonating && u.id !== user.id && (
                                <button
                                  onClick={() => router.post(`/impersonate/${u.id}`)}
                                  className="p-1.5 text-slate-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/40 rounded-lg transition-colors cursor-pointer"
                                  title={`Impersonate ${u.username}`}
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {!isDeveloper && (u.role === 'administrator' || u.role === 'developer') ? (
                                <span className="text-xs text-slate-400 italic">Restricted</span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => openEditModal(u)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="Edit User"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(u)}
                                    disabled={u.id === user.id}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredUsers.length > 0 && (
                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 shrink-0">
                  <div className="flex items-center gap-2">
                    <span>Show</span>
                    <select
                      value={perPage}
                      onChange={(e) => setPerPage(Number(e.target.value))}
                      className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-lg text-xs py-1 pl-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 font-medium">Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Streamlined Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {editingUser ? 'Edit User Account' : 'Add New User'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {editingUser ? `Updating credentials for @${editingUser.username}` : 'Configure user role and account credentials.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={data.first_name}
                      onChange={(e) => setData('first_name', e.target.value)}
                      placeholder="e.g. Maria"
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${
                        errors.first_name ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                      }`}
                    />
                    {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={data.last_name}
                      onChange={(e) => setData('last_name', e.target.value)}
                      placeholder="e.g. Santos"
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${
                        errors.last_name ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                      }`}
                    />
                    {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={data.username}
                      onChange={(e) => setData('username', e.target.value)}
                      placeholder="e.g. msantos"
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-xl font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${
                        errors.username ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                      }`}
                    />
                    {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={data.role}
                      onChange={(e) => setData('role', e.target.value as UserFormData['role'])}
                      disabled={!isDeveloper}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize dark:text-white disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800 ${
                        errors.role ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <option value="user">User</option>
                      {isDeveloper && (
                        <>
                          <option value="administrator">Administrator</option>
                          <option value="developer">Developer</option>
                        </>
                      )}
                    </select>
                    {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="e.g. maria.santos@hospital.gov.ph"
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${
                      errors.email ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password {editingUser ? <span className="text-slate-400 font-normal">(Leave blank to keep current)</span> : <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder={editingUser ? '••••••••' : 'Enter secure password'}
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${
                      errors.password ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex gap-3 justify-end items-center">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:text-slate-800 dark:hover:text-white text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="user-form"
                disabled={processing}
                className="px-5 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
              >
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

      {isImpersonateModalOpen && (
        <ImpersonateModal
          users={users.filter(u => u.id !== user.id)}
          onClose={() => setIsImpersonateModalOpen(false)}
        />
      )}
    </div>
  );
}
