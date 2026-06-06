import { useState } from 'react';
import { usePage, useForm, router } from '@inertiajs/react';
import { User, Shield, Key, Save } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import Header from '../Components/Header';
import ImpersonationBanner from '../Components/ImpersonationBanner';
import Toast from '../Components/Toast';
import { AuthUser, UserSummary } from '../types';

interface ProfileProps {
  auth: { user: AuthUser };
  users?: UserSummary[];
}

export default function Profile({ auth, users }: ProfileProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Profile Information Form
  const profileForm = useForm({
    first_name: auth.user.first_name,
    last_name: auth.user.last_name,
    username: auth.user.username,
    email: auth.user.email,
  });

  const submitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    profileForm.patch('/profile', {
      preserveScroll: true,
    });
  };

  // Password Update Form
  const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    passwordForm.put('/password', {
      preserveScroll: true,
      onSuccess: () => passwordForm.reset(),
    });
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Toast />
      
      {isMobileOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
      )}
      <Sidebar isMobileOpen={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} user={auth.user} currentView="profile" onNavigate={(view) => router.visit('/catalog')} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {auth.user.is_impersonating && <ImpersonationBanner user={auth.user} />}
        <Header onOpenMobile={() => setIsMobileOpen(true)} user={auth.user} users={users} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">My Profile</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your personal information and account security.</p>
            </div>

            {/* Profile Information */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-3">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile Information</h2>
              </div>
              <div className="p-6">
                <form onSubmit={submitProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                      <input
                        type="text"
                        value={profileForm.data.first_name}
                        onChange={e => profileForm.setData('first_name', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 dark:text-white transition-colors"
                        required
                      />
                      {profileForm.errors.first_name && <p className="text-rose-500 text-xs mt-1">{profileForm.errors.first_name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={profileForm.data.last_name}
                        onChange={e => profileForm.setData('last_name', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 dark:text-white transition-colors"
                        required
                      />
                      {profileForm.errors.last_name && <p className="text-rose-500 text-xs mt-1">{profileForm.errors.last_name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Username</label>
                      <input
                        type="text"
                        value={profileForm.data.username}
                        onChange={e => profileForm.setData('username', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 dark:text-white transition-colors"
                        required
                      />
                      {profileForm.errors.username && <p className="text-rose-500 text-xs mt-1">{profileForm.errors.username}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={profileForm.data.email}
                        onChange={e => profileForm.setData('email', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 dark:text-white transition-colors"
                        required
                      />
                      {profileForm.errors.email && <p className="text-rose-500 text-xs mt-1">{profileForm.errors.email}</p>}
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={profileForm.processing}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> Save Information
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Update Password */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-3">
                <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Update Password</h2>
              </div>
              <div className="p-6">
                <form onSubmit={submitPassword} className="space-y-6 max-w-xl">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.data.current_password}
                      onChange={e => passwordForm.setData('current_password', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                    />
                    {passwordForm.errors.current_password && <p className="text-rose-500 text-xs mt-1">{passwordForm.errors.current_password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.data.password}
                      onChange={e => passwordForm.setData('password', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                    />
                    {passwordForm.errors.password && <p className="text-rose-500 text-xs mt-1">{passwordForm.errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.data.password_confirmation}
                      onChange={e => passwordForm.setData('password_confirmation', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                    />
                    {passwordForm.errors.password_confirmation && <p className="text-rose-500 text-xs mt-1">{passwordForm.errors.password_confirmation}</p>}
                  </div>
                  <div className="flex justify-start pt-2">
                    <button
                      type="submit"
                      disabled={passwordForm.processing}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Shield className="w-4 h-4" /> Change Password
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
