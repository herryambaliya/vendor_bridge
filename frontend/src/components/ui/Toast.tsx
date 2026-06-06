import React, { useEffect } from 'react';
import { create } from 'zustand';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }]
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  }
}));

// Global Toast Container Component
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full no-print">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onClose: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-400 shrink-0" />
  };

  const bgStyles = {
    success: 'bg-emerald-950/90 border-emerald-800/40 text-emerald-200',
    error: 'bg-rose-950/90 border-rose-800/40 text-rose-200',
    warning: 'bg-amber-950/90 border-amber-800/40 text-amber-200',
    info: 'bg-slate-900/95 border-slate-800 text-slate-200'
  };

  return (
    <div className={`flex items-start justify-between p-4 rounded-xl border backdrop-blur-md shadow-2xl animate-slide-in transform transition-all duration-300 ${bgStyles[toast.type]}`}>
      <div className="flex items-center gap-3">
        {icons[toast.type]}
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-200 transition-colors ml-4 focus:outline-none"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Global helper function for easier triggers
export const showToast = {
  success: (msg: string, dur?: number) => useToastStore.getState().addToast(msg, 'success', dur),
  error: (msg: string, dur?: number) => useToastStore.getState().addToast(msg, 'error', dur),
  warning: (msg: string, dur?: number) => useToastStore.getState().addToast(msg, 'warning', dur),
  info: (msg: string, dur?: number) => useToastStore.getState().addToast(msg, 'info', dur)
};

export default ToastContainer;
