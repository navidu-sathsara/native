'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { api } from '@/lib/api';

const AuthContext = createContext(null);
const ToastContext = createContext(null);

export function Providers({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await api('/me');
      setUser(result.authenticated ? result.user : null);
      return result.authenticated ? result.user : null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const unauthorized = () => setUser(null);
    window.addEventListener('nora:unauthorized', unauthorized);
    return () => window.removeEventListener('nora:unauthorized', unauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await api('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api('/logout', { method: 'POST' }); } finally { setUser(null); }
  }, []);

  const value = useMemo(() => ({ user, setUser, loading, login, logout, refresh }), [user, loading, login, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current.slice(-3), { id, message, type }]);
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  const meta = {
    success: {
      icon: CheckCircle2,
      label: 'SYSTEM // SUCCESS',
      iconColor: 'text-jade',
      barColor: 'bg-jade',
      tagColor: 'border-jade/40 bg-jade/10 text-jade',
    },
    error: {
      icon: AlertCircle,
      label: 'SYSTEM // ERROR',
      iconColor: 'text-ember',
      barColor: 'bg-ember',
      tagColor: 'border-ember/40 bg-ember/10 text-ember',
    },
    warning: {
      icon: AlertTriangle,
      label: 'SYSTEM // WARNING',
      iconColor: 'text-amber-600',
      barColor: 'bg-amber-500',
      tagColor: 'border-amber-500/40 bg-amber-500/10 text-amber-700',
    },
    info: {
      icon: Info,
      label: 'SYSTEM // EVENT',
      iconColor: 'text-ink',
      barColor: 'bg-ink',
      tagColor: 'border-ink/20 bg-paper-2 text-ink-soft',
    },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-5 top-5 z-[100] flex w-[min(26rem,calc(100vw-2.5rem))] flex-col gap-3"
        aria-live="polite"
      >
        {toasts.map((item) => {
          const itemMeta = meta[item.type] || meta.info;
          const Icon = itemMeta.icon;

          return (
            <div
              key={item.id}
              className="anim-rise pointer-events-auto flex overflow-hidden border border-ink bg-white shadow-[4px_4px_0_#111111]"
            >
              {/* Left Colored Stripe */}
              <div className={`w-1.5 shrink-0 ${itemMeta.barColor}`} />

              <div className="flex flex-1 flex-col gap-1.5 p-3.5 min-w-0">
                {/* Header line */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${itemMeta.iconColor}`} strokeWidth={2} />
                    <span className="lp-mono text-[9px] text-ink-faint">
                      {itemMeta.label}
                    </span>
                  </div>
                  <button
                    onClick={() => dismiss(item.id)}
                    aria-label="Dismiss notification"
                    className="border border-ink/20 bg-paper-2 p-0.5 text-ink-soft hover:bg-ink hover:text-white hover:border-ink transition cursor-pointer"
                  >
                    <X className="h-3 w-3" strokeWidth={2} />
                  </button>
                </div>

                {/* Body message */}
                <p className="font-mono text-xs font-bold text-ink leading-snug break-words">
                  {item.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside Providers');
  return value;
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside Providers');
  return value;
}
