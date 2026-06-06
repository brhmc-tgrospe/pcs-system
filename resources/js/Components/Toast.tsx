import { useEffect, useState, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface ToastProps {
  duration?: number;
}

export default function Toast({ duration = 4000 }: ToastProps) {
  const { flash } = usePage<any>().props;
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error'>('success');
  const prevFlashRef = useRef<string | null>(null);

  useEffect(() => {
    const currentMsg = flash?.success || flash?.error || null;
    // Build a unique key from the message + a timestamp from the page props
    // so that identical successive messages still trigger a toast
    const flashKey = currentMsg ? `${currentMsg}-${Date.now()}` : null;

    if (currentMsg && flashKey !== prevFlashRef.current) {
      prevFlashRef.current = flashKey;
      setMessage(currentMsg);
      setType(flash?.success ? 'success' : 'error');
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [flash?.success, flash?.error]);

  if (!isVisible || !message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border backdrop-blur-sm ${
        type === 'success' 
          ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800' 
          : 'bg-rose-50/95 border-rose-200 text-rose-800'
      }`}>
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
        )}
        
        <p className="font-semibold text-sm mr-4">{message}</p>
        
        <button 
          onClick={() => setIsVisible(false)}
          className={`p-1 rounded-md transition-colors ${
            type === 'success' ? 'hover:bg-emerald-100 text-emerald-600' : 'hover:bg-rose-100 text-rose-600'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
