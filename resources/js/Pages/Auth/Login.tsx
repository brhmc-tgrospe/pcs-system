import { useState, FormEventHandler } from 'react';
import { useForm } from '@inertiajs/react';
import { PackageSearch, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  status?: string;
  canResetPassword?: boolean;
}

export default function Login({ status }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    login: '',
    password: '',
    remember: false as boolean,
  });

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/login', {
      onFinish: () => reset('password'),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-3xl"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-100/50 blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] overflow-hidden z-10 border border-slate-100">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4">
              <img src="/pcs-logo.png" alt="PCS Logo" className="w-16 h-16 object-contain rounded-2xl shadow-md border border-white/10" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">PCS Portal</h1>
            <p className="text-blue-100/80 font-medium text-sm mt-1">BRHMC Procurement Catalog System</p>
          </div>
        </div>

        <div className="p-8">
          {status && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium">
              {status}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login" className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Username or Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="login"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={data.login}
                  onChange={(e) => setData('login', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 ${
                    errors.login ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                  placeholder="Enter your username or email"
                />
              </div>
              {errors.login && <p className="mt-1.5 ml-1 text-xs font-medium text-red-600">{errors.login}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1 pr-1">
                <label htmlFor="password" className="block text-sm font-bold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 ${
                    errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 ml-1 text-xs font-medium text-red-600">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {processing ? 'Signing in...' : 'Sign In to Portal'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Authorized Personnel Only
          </div>
        </div>
      </div>
    </div>
  );
}
