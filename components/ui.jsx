'use client';

import { useEffect, useState } from 'react';
import { LoaderCircle, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/api';

/* ------------------------------------------------------------------
   Native SaaS UI Primitives - Stripe Inspired Light Theme
   ------------------------------------------------------------------ */

export function Button({ children, variant = 'secondary', size = 'md', className, loading, disabled, ...props }) {
  const variants = {
    primary: 'bg-blurple-500 text-white font-semibold hover:bg-blurple-600 active:scale-[.97] shadow-sm',
    secondary: 'border border-brand-200 bg-white text-brand-700 hover:bg-brand-50 active:scale-[.97] shadow-sm',
    ghost: 'border-transparent bg-transparent text-brand-600 hover:bg-brand-50 hover:text-brand-900 active:scale-[.97]',
    danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50 active:scale-[.97] shadow-sm',
    success: 'border border-green-200 bg-white text-green-700 hover:bg-green-50 active:scale-[.97] shadow-sm',
  };
  const sizes = {
    sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
    md: 'h-10 gap-2 rounded-xl px-4 text-[13px]',
    lg: 'h-12 gap-2 rounded-xl px-6 text-sm font-semibold',
  };
  return (
    <button
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-medium tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blurple-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin text-current" />}
      {children}
    </button>
  );
}

export function IconButton({ label, children, className, ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-200 bg-white text-brand-500 transition-all duration-200 hover:bg-brand-50 hover:text-brand-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blurple-500 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="anim-rise flex flex-col gap-4 border-b border-brand-100 pb-6 mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-500">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-brand-600">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

export function Panel({ children, className, highlight = false }) {
  return (
    <section className={cn('rounded-xl border border-brand-200 bg-white shadow-sm overflow-hidden', highlight && 'ring-1 ring-blurple-500 border-blurple-500', className)}>
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'default', highlight = false }) {
  const dots = {
    default: 'bg-brand-300',
    blue: 'bg-blurple-500',
    green: 'bg-green-500',
    red: 'bg-red-500 animate-pulse',
    amber: 'bg-amber-500',
  };
  return (
    <Panel highlight={highlight} className="group relative flex min-h-32 items-start justify-between p-5 transition-shadow hover:shadow-md">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-500">
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dots[tone] || dots.default)} />
          <span className="truncate">{label}</span>
        </p>
        <p className="tnum mt-3 text-3xl font-bold tracking-tight text-brand-900">{value}</p>
        {hint && <p className="mt-2 truncate text-xs text-brand-500">{hint}</p>}
      </div>
      {Icon && (
        <span className="shrink-0 rounded-lg border border-brand-100 bg-brand-50 p-2 text-brand-500 transition-colors group-hover:bg-brand-100 group-hover:text-brand-900">
          <Icon className="h-5 w-5" />
        </span>
      )}
    </Panel>
  );
}

export function StatusBadge({ status }) {
  const normalized = String(status || 'stopped').toLowerCase();
  const tones = {
    running: { wrap: 'border-green-200 bg-green-50 text-green-700', dot: 'bg-green-500' },
    online: { wrap: 'border-green-200 bg-green-50 text-green-700', dot: 'bg-green-500' },
    done: { wrap: 'border-green-200 bg-green-50 text-green-700', dot: 'bg-green-500' },
    stopped: { wrap: 'border-brand-200 bg-brand-50 text-brand-600', dot: 'bg-brand-400' },
    offline: { wrap: 'border-brand-200 bg-brand-50 text-brand-600', dot: 'bg-brand-400' },
    cancelled: { wrap: 'border-brand-200 bg-brand-50 text-brand-600', dot: 'bg-brand-400' },
    pending: { wrap: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500 animate-pulse' },
    partial: { wrap: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
    running_job: { wrap: 'border-blurple-200 bg-blurple-50 text-blurple-700', dot: 'bg-blurple-500 animate-pulse' },
    error: { wrap: 'border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500' },
    failed: { wrap: 'border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500' },
  };
  const tone = tones[normalized] || tones.stopped;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest', tone.wrap)}>
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', tone.dot)} />
      {normalized.replace('_', ' ')}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="anim-fade flex min-h-64 flex-col items-center justify-center px-6 py-16 text-center bg-white rounded-xl border border-brand-200 border-dashed">
      {Icon && (
        <div className="mb-4 rounded-full bg-brand-50 p-4 text-brand-400">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <h3 className="text-lg font-bold tracking-tight text-brand-900">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-brand-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, description, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="anim-fade fixed inset-0 z-[70] flex items-end justify-center bg-brand-900/20 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'anim-scale max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl border border-brand-200',
          wide ? 'max-w-3xl' : 'max-w-lg'
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-brand-100 bg-white px-6 py-5">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-lg font-bold tracking-tight text-brand-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-brand-600">{description}</p>}
          </div>
          <IconButton label="Close" className="h-8 w-8 shrink-0 bg-brand-50 border-brand-100" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="p-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-brand-100 bg-brand-50 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}

export function Select({ value, onChange, options, className, placeholder = 'Select option' }) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = () => setOpen(false);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [open]);

  return (
    <div className={cn('relative inline-block w-full', className)} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-brand-200 bg-white px-3.5 py-2 text-left text-sm text-brand-900 shadow-sm transition-all duration-200 hover:bg-brand-50 focus:border-blurple-500 focus:outline-none focus:ring-1 focus:ring-blurple-500"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-brand-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="anim-scale absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-brand-200 bg-white p-1 shadow-lg">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors duration-150',
                  active
                    ? 'bg-brand-50 text-blurple-600 font-medium'
                    : 'text-brand-700 hover:bg-brand-50 hover:text-brand-900'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-4">
      <LoaderCircle className="h-8 w-8 animate-spin text-blurple-500" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-500">{label}</span>
    </div>
  );
}

export function Tabs({ items, value, onChange }) {
  return (
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-brand-200 bg-brand-50 p-1">
      {items.map((item) => {
        const active = value === item.value;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
              active ? 'bg-white text-brand-900 shadow-sm border border-brand-100' : 'text-brand-600 hover:bg-white/50 hover:text-brand-900'
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function Checkbox({ checked, onChange, label, description, disabled }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200',
        checked ? 'border-blurple-200 bg-blurple-50' : 'border-brand-200 bg-white hover:bg-brand-50 hover:border-brand-300',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-all duration-200 shadow-sm',
          checked ? 'border-blurple-500 bg-blurple-500 text-white' : 'border-brand-300 bg-white'
        )}
      >
        <svg viewBox="0 0 12 12" className={cn('h-3 w-3 transition-transform duration-200', checked ? 'scale-100' : 'scale-0')} fill="none">
          <path d="M1.5 6.2 4.4 9l6-6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-brand-900">{label}</span>
        {description && <span className="mt-1 block text-xs text-brand-600">{description}</span>}
      </span>
    </label>
  );
}

export function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-brand-100', className)} />
  );
}
