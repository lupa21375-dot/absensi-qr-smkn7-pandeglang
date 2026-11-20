import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 left-0 right-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const elRef = useRef(null);

  useEffect(() => {
    if (elRef.current) {
      gsap.fromTo(
        elRef.current,
        { y: -30, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.7)' }
      );
    }
  }, []);

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div
      ref={elRef}
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl max-w-md w-full text-sm font-medium border backdrop-blur-md transition-all ${
        isError
          ? 'bg-rose-950/90 text-rose-100 border-rose-700/50 shadow-rose-950/40'
          : isSuccess
          ? 'bg-emerald-950/90 text-emerald-100 border-emerald-700/50 shadow-emerald-950/40'
          : 'bg-slate-900/90 text-slate-100 border-slate-700/50 shadow-slate-950/40'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
      ) : isSuccess ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      ) : (
        <Info className="w-5 h-5 text-blue-400 shrink-0" />
      )}
      <span className="flex-1 text-left leading-snug">{toast.message}</span>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
