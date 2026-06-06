import { router } from '@inertiajs/react';
import { UserCircle2, XCircle } from 'lucide-react';
import { AuthUser } from '../types';

interface ImpersonationBannerProps {
  user: AuthUser;
}

export default function ImpersonationBanner({ user }: ImpersonationBannerProps) {
  if (!user.is_impersonating) return null;

  const handleLeaveImpersonation = () => {
    router.post('/impersonate/leave');
  };

  return (
    <div className="fixed top-0 inset-x-0 bg-fuchsia-600 text-white z-50 px-4 py-2 flex items-center justify-between shadow-md h-10 border-b border-fuchsia-700">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <UserCircle2 className="w-5 h-5 opacity-80" />
        <span>
          Developer Impersonation Mode: Viewing as <span className="font-bold underline decoration-fuchsia-400 underline-offset-2">{user.username}</span> ({user.role})
        </span>
      </div>
      <button
        onClick={handleLeaveImpersonation}
        className="flex items-center gap-1.5 px-3 py-1 bg-white text-fuchsia-700 hover:bg-fuchsia-50 rounded text-xs font-bold transition-colors shadow-sm"
      >
        <XCircle className="w-4 h-4" />
        Return to Developer
      </button>
    </div>
  );
}
