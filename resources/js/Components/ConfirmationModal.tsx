import { X, AlertTriangle, LucideIcon } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  confirmText?: string;
  confirmColor?: 'rose' | 'emerald' | 'blue';
  Icon?: LucideIcon;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isProcessing = false,
  confirmText = 'Confirm',
  confirmColor = 'rose',
  Icon = AlertTriangle,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const colorStyles = {
    rose: {
      bg: 'bg-rose-100 dark:bg-rose-900/30',
      text: 'text-rose-600 dark:text-rose-400',
      btn: 'bg-rose-600 hover:bg-rose-700',
    },
    emerald: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      btn: 'bg-emerald-600 hover:bg-emerald-700',
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      btn: 'bg-blue-600 hover:bg-blue-700',
    }
  };

  const style = colorStyles[confirmColor];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-start p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${style.text}`} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors mt-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-6 py-2 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-60 ${style.btn}`}
          >
            {isProcessing ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
