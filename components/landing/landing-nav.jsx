'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { cn } from '@/lib/api';
import { NoraLogo } from '@/components/nora-logo';

const LINKS = [
  { href: '#platform', label: 'Products' },
  { href: '#workflow', label: 'Solutions' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'Resources' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
        <nav
          className={cn(
            'flex w-full max-w-7xl items-center justify-between gap-2 rounded-full px-5 py-3 transition-all duration-500 ease-out',
            scrolled
              ? 'bg-white/80 shadow-sm backdrop-blur-md border border-brand-100'
              : 'bg-transparent border border-transparent'
          )}
        >
          {/* Logo and Nav Links grouped on the left */}
          <div className="flex items-center gap-6">
            <Link href="/" className="group flex items-center gap-2 pl-1">
              <NoraLogo className="h-7 w-7 text-brand-900 transition-transform duration-300 group-hover:scale-105" />
              <span className="text-xl font-bold tracking-tight text-brand-900">Native</span>
            </Link>

            <div className="hidden items-center gap-1 md:flex border-l border-brand-200 pl-6 ml-2">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-900"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Action buttons on the right */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-brand-600 transition-colors hover:text-brand-900 sm:block px-2"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="btn-primary group"
            >
              Launch console
              <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              className="rounded-full p-2 text-brand-600 hover:bg-brand-50 md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 bg-white/95 pt-28 backdrop-blur-xl md:hidden" onClick={() => setOpen(false)}>
          <div className="flex flex-col gap-1 px-6">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="border-b border-brand-100 py-5 text-2xl font-semibold tracking-tight text-brand-900"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
