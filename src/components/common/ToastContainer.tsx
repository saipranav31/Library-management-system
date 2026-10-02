import React from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useLibrary();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';

        const bgBorder = isSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : isWarning
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : isError
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : 'bg-blue-50 border-blue-200 text-blue-900';

        const icon = isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        ) : isWarning ? (
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        ) : isError ? (
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
        ) : (
          <Info className="w-5 h-5 text-blue-600 shrink-0" />
        );

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-300 ${bgBorder}`}
          >
            {icon}
            <div className="flex-1 text-sm min-w-0">
              <p className="font-semibold leading-tight">{toast.title}</p>
              <p className="text-xs opacity-90 mt-0.5 leading-normal">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-70 hover:opacity-100 p-0.5 text-current rounded-md hover:bg-black/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
