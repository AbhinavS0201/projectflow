// src/components/Modal.jsx  — shared modal shell + primitives
import { useEffect } from 'react';

export const inputCls = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all';
export const primaryBtn = 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_24px_rgba(59,130,246,0.45)] hover:-translate-y-px transition-all disabled:opacity-50';
export const ghostBtn = 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.07] transition-all';

export function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const handler = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease]"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`w-full ${maxWidth} bg-[#111827] border border-white/[0.1] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] animate-[slideUp_0.2s_cubic-bezier(0.34,1.56,0.64,1)] max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <h2 className="font-display text-lg font-extrabold">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.1] transition-all text-sm">
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
