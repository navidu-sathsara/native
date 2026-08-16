'use client';

import { useEffect, useState } from 'react';
import { LoaderCircle, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/api';

/* ------------------------------------------------------------------
   Native SaaS UI Primitives - Editorial Developer Theme
   High-contrast, tactile, robust typography & solid borders
   ------------------------------------------------------------------ */

export function Button({ children, variant = 'secondary', size = 'md', className, loading, disabled, ...props }) {
  const variants = {
    primary:
      'border border-ink bg-ember text-white font-mono font-bold uppercase tracking-wider shadow-[2px_2px_0_#111111] hover:bg-ember-dark hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#111111] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#111111]',
    secondary:
      'border border-ink bg-white text-ink font-mono font-bold uppercase tracking-wider shadow-[2px_2px_0_#111111] hover:bg-paper-2 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#111111] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#111111]',
    ghost:
      'border border-transparent bg-transparent text-ink-soft hover:border-ink/20 hover:bg-ink/5 hover:text-ink font-mono font-bold uppercase tracking-wider active:translate-y-px',
    danger:
      'border border-ember bg-white text-ember font-mono font-bold uppercase tracking-wider shadow-[2px_2px_0_#ff4400] hover:bg-ember hover:text-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#ff4400]',
    success:
      'border border-jade bg-white text-jade font-mono font-bold uppercase tracking-wider shadow-[2px_2px_0_#059669] hover:bg-jade hover:text-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#059669]',
  };
  const sizes = {
    sm: 'h-8 gap-1.5 px-3 text-[11px]',
    md: 'h-10 gap-2 px-4 text-xs',
    lg: 'h-12 gap-2 px-6 text-sm',
  };
  return (
    <button
      className={cn(
        'inline-flex shrink-0 items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:shadow-none cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin text-current shrink-0" />}
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
        'inline-flex h-9 w-9 items-center justify-center border border-ink bg-white text-ink shadow-[2px_2px_0_#111111] hover:bg-paper-2 hover:shadow-[3px_3px_0_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#111111] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember cursor-pointer',
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
    <header className="flex flex-col gap-4 border-b border-rule pb-6 mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2.5 flex items-center gap-2.5 lp-mono text-ink-soft text-[11px]">
            <span className="h-1.5 w-1.5 bg-ember shrink-0" />
            {eyebrow}
          </p>
        )}
        <h1 className="lp-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

export function Panel({ children, className, highlight = false }) {
  return (
    <section
      className={cn(
        'border border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)] overflow-hidden',
        highlight && 'border-ember ring-1 ring-ember shadow-[4px_4px_0_#ff4400]',
        className
      )}
    >
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'default', highlight = false }) {
  const dots = {
    default: 'bg-ink-soft',
    blue: 'bg-ember',
    green: 'bg-jade',
    red: 'bg-ember animate-pulse',
    amber: 'bg-amber-500',
  };
  return (
    <Panel highlight={highlight} className="group relative flex min-h-32 items-start justify-between p-6 transition-all hover:border-ink">
      <div className="min-w-0">
        <p className="flex items-center gap-2 lp-mono text-ink-faint text-[10px]">
          <span className={cn('h-1.5 w-1.5 shrink-0', dots[tone] || dots.default)} />
          <span className="truncate">{label}</span>
        </p>
        <p className="lp-display mt-3 text-3xl sm:text-4xl font-bold text-ink tracking-tight">{value}</p>
        {hint && <p className="mt-2 truncate text-xs text-ink-soft font-mono">{hint}</p>}
      </div>
      {Icon && (
        <span className="shrink-0 border border-ink/20 bg-paper-2 p-2.5 text-ink transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
      )}
    </Panel>
  );
}

export function StatusBadge({ status }) {
  const normalized = String(status || 'stopped').toLowerCase();
  const tones = {
    running: { wrap: 'border-jade/40 bg-jade/10 text-jade', dot: 'bg-jade animate-pulse' },
    online: { wrap: 'border-jade/40 bg-jade/10 text-jade', dot: 'bg-jade animate-pulse' },
    done: { wrap: 'border-jade/40 bg-jade/10 text-jade', dot: 'bg-jade' },
    stopped: { wrap: 'border-ink/20 bg-paper-2 text-ink-soft', dot: 'bg-ink-faint' },
    offline: { wrap: 'border-ink/20 bg-paper-2 text-ink-soft', dot: 'bg-ink-faint' },
    cancelled: { wrap: 'border-ink/20 bg-paper-2 text-ink-soft', dot: 'bg-ink-faint' },
    pending: { wrap: 'border-amber-500/40 bg-amber-500/10 text-amber-700', dot: 'bg-amber-500 animate-pulse' },
    partial: { wrap: 'border-amber-500/40 bg-amber-500/10 text-amber-700', dot: 'bg-amber-500' },
    running_job: { wrap: 'border-ember/40 bg-ember/10 text-ember', dot: 'bg-ember animate-pulse' },
    error: { wrap: 'border-ember/40 bg-ember/10 text-ember', dot: 'bg-ember' },
    failed: { wrap: 'border-ember/40 bg-ember/10 text-ember', dot: 'bg-ember' },
  };
  const tone = tones[normalized] || tones.stopped;
  return (
    <span className={cn('inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider', tone.wrap)}>
      <span className={cn('h-1.5 w-1.5 shrink-0', tone.dot)} />
      {normalized.replace('_', ' ')}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center bg-white border border-dashed border-ink/30 shadow-sm">
      {Icon && (
        <div className="mb-4 border border-ink/20 bg-paper-2 p-4 text-ink-soft">
          <Icon className="h-8 w-8" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="lp-display text-xl font-bold text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-ink-soft leading-relaxed">{description}</p>}
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
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'max-h-[calc(100vh-2rem)] w-full overflow-y-auto border border-ink bg-white shadow-[10px_10px_0_#111111]',
          wide ? 'max-w-3xl' : 'max-w-lg'
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-ink bg-paper-2 px-6 py-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="lp-display text-xl font-bold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-ink-soft font-mono">{description}</p>}
          </div>
          <IconButton label="Close" className="h-8 w-8 shrink-0 bg-white" onClick={onClose}>
            <X className="h-4 w-4" strokeWidth={1.5} />
          </IconButton>
        </div>
        <div className="p-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-rule bg-paper-2 px-6 py-4">{footer}</div>
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
        className="flex h-11 w-full items-center justify-between border border-ink bg-white px-3.5 py-2 text-left font-mono text-xs text-ink shadow-[2px_2px_0_#111111] transition-all hover:bg-paper-2 focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember cursor-pointer"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-ink-soft transition-transform duration-150', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto border border-ink bg-white p-1 shadow-[4px_4px_0_#111111]">
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
                  'flex w-full items-center px-3 py-2 text-left font-mono text-xs transition-colors cursor-pointer',
                  active
                    ? 'bg-ember text-white font-bold'
                    : 'text-ink hover:bg-paper-2'
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

export function Spinner({ label = 'Loading telemetry' }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3">
      <LoaderCircle className="h-8 w-8 animate-spin text-ember" />
      <span className="lp-mono text-[11px] text-ink-soft">{label}</span>
    </div>
  );
}

export function Tabs({ items, value, onChange }) {
  return (
    <div className="flex max-w-full gap-1 overflow-x-auto border border-ink bg-paper-2 p-1">
      {items.map((item) => {
        const active = value === item.value;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative whitespace-nowrap px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer',
              active
                ? 'border border-ink bg-white text-ink shadow-[2px_2px_0_#111111]'
                : 'text-ink-soft hover:text-ink hover:bg-white/50'
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
        'flex cursor-pointer items-start gap-3 border p-4 transition-all duration-150',
        checked ? 'border-ink bg-white shadow-[2px_2px_0_#111111]' : 'border-ink/20 bg-paper hover:bg-white hover:border-ink',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border transition-all duration-150',
          checked ? 'border-ink bg-ember text-white' : 'border-ink bg-white'
        )}
      >
        <svg viewBox="0 0 12 12" className={cn('h-3 w-3 transition-transform duration-150', checked ? 'scale-100' : 'scale-0')} fill="none">
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
        <span className="block text-sm font-bold text-ink">{label}</span>
        {description && <span className="mt-1 block text-xs text-ink-soft leading-relaxed">{description}</span>}
      </span>
    </label>
  );
}

export function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse bg-rule', className)} />
  );
}
