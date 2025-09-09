/** A lightweight toast system with no extra dependencies. Always positioned at the bottom right, with variants: ✓ success, ⚠️ warning, ❌ error.*/

// src/hooks/useBrindToast.tsx
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { BrindCtx } from '@/types/domainTypes';

type BrindType = 'success' | 'warning' | 'error';
type BrindItem = { id: string; type: BrindType; message: string; timeout?: number };

const BrindContext = createContext<BrindCtx | null>(null);

export const BrindProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<BrindItem[]>([]);

  // Remove toast helper
  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Factory to enqueue a toast
  const enqueue = useCallback(
    (type: BrindType, message: string, timeout = 3500) => {
      const id = crypto.randomUUID();
      const item: BrindItem = { id, type, message, timeout };
      setItems((prev) => [...prev, item]);
      if (timeout > 0) {
        window.setTimeout(() => remove(id), timeout);
      }
    },
    [remove],
  );

  const value = useMemo<BrindCtx>(
    () => ({
      showSuccess: (m, t) => enqueue('success', m, t),
      showWarning: (m, t) => enqueue('warning', m, t),
      showError: (m, t) => enqueue('error', m, t),
    }),
    [enqueue],
  );

  return (
    <BrindContext.Provider value={value}>
      {children}
      {/* Toaster – anchored bottom-right, mobile-safe */}
      <div className='fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-[92vw] sm:max-w-sm'>
        {items.map((it) => {
          const icon = it.type === 'success' ? '✓' : it.type === 'warning' ? '⚠️' : '❌';
          const base =
            it.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : it.type === 'warning'
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-rose-300 bg-rose-50 text-rose-900';
          return (
            <div
              key={it.id}
              className={`shadow-lg border rounded-xl p-3 sm:p-4 flex items-start gap-3 ${base} animate-in fade-in slide-in-from-bottom-2`}
              role='status'
              aria-live='polite'
            >
              <span className='text-lg leading-none'>{icon}</span>
              <p className='text-sm sm:text-[15px] leading-snug'>{it.message}</p>
              <button
                onClick={() => remove(it.id)}
                className='ml-auto opacity-60 hover:opacity-100 transition-opacity'
                aria-label='Close notification'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
          );
        })}
      </div>
    </BrindContext.Provider>
  );
};

export const useBrind = () => {
  const ctx = useContext(BrindContext);
  if (!ctx) throw new Error('useBrind must be used within <BrindProvider>');
  return ctx;
};
