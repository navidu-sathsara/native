'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { cn } from '@/lib/api';
import { NoraLogo } from '@/components/nora-logo';

const LINKS = [
  { href: '#platform', label: 'Platform' },
  { href: '#workflow', label: 'Workflow' },
  { href: '#registry', label: 'Registry' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b bg-paper/85 backdrop-blur-xl backdrop-saturate-150 transition-colors duration-200',
        scrolled ? 'border-ink/12' : 'border-ink/0'
      )}
      data-testid="landing-nav"
    >
      <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          data-testid="nav-logo-link"
        >
          <span className="lp-display text-[22px] leading-none text-ink">Native</span>
          <span className="lp-mono hidden text-ink-faint sm:block">/ v4</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-testid={`nav-link-${link.label.toLowerCase()}`}
              className="lp-mono px-3 py-2 text-ink-soft transition-colors duration-150 hover:text-ember focus:outline-none focus:ring-2 focus:ring-ember"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="lp-mono hidden text-ink-soft transition-colors duration-150 hover:text-ink sm:block"
            data-testid="nav-signin-link"
          >
            Sign in
          </Link>
          <Link href="/login" className="lp-btn hidden sm:inline-flex" data-testid="nav-cta-button">
            Launch console
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            data-testid="nav-mobile-toggle"
            className="border border-ink p-2 text-ink transition-colors duration-150 hover:bg-ink hover:text-paper md:hidden"
          >
            {open ? <X className="h-4 w-4" strokeWidth={1.5} /> : <Menu className="h-4 w-4" strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-ink/10 bg-paper md:hidden" data-testid="nav-mobile-menu">
          <div className="flex flex-col px-5 pb-6 pt-2">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                data-testid={`nav-mobile-link-${link.label.toLowerCase()}`}
                className="lp-display border-b border-rule py-4 text-3xl text-ink"
              >
                {link.label}
              </a>
            ))}
            <Link href="/login" className="lp-btn mt-6 justify-center" data-testid="nav-mobile-cta">
              Launch console
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
