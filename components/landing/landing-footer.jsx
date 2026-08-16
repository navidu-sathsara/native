'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal, Marquee } from '@/components/reveal';
import { NoraLogo } from '@/components/nora-logo';

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Overview', href: '#platform' },
      { label: 'Workflow', href: '#workflow' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Console',
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'Fleet dashboard', href: '/login' },
      { label: 'Proxy network', href: '/login' },
      { label: 'Script library', href: '/login' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#platform' },
      { label: 'Module registry', href: '#platform' },
      { label: 'Status', href: '#platform' },
      { label: 'Changelog', href: '#platform' },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden bg-white border-t border-brand-100">
      
      {/* Closing statement */}
      <div className="relative mx-auto max-w-5xl px-6 pt-24 sm:pt-32">
        <Reveal className="text-center">
          <p className="stripe-badge mb-7">Ready when you are</p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-brand-900 tracking-tight leading-tight">
            Run the fleet.
            <br />
            <span className="text-brand-400">Not the chaos.</span>
          </h2>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="btn-primary group"
            >
              Launch console
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#pricing"
              className="btn-secondary"
            >
              Compare plans
            </a>
          </div>
        </Reveal>
      </div>

      {/* Oversized wordmark marquee */}
      <div className="relative mt-24 select-none border-y border-brand-100 py-6 bg-brand-50">
        <Marquee duration={40}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="flex items-center gap-8 pr-8 text-6xl sm:text-8xl font-bold text-brand-200"
            >
              NATIVE
              <span className="h-4 w-4 rounded-full bg-brand-200" />
            </span>
          ))}
        </Marquee>
      </div>

      {/* Link columns */}
      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2">
              <NoraLogo className="h-8 w-8 text-brand-900" />
              <span className="text-lg font-bold tracking-tight text-brand-900">Native</span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-brand-600">
              The control plane for autonomous fleets. Deploy, orchestrate and observe
              hundreds of bots from one obsessively designed dashboard.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-sm" />
              All systems operational
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-900">{column.title}</p>
              <ul className="mt-5 space-y-4">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-colors hover:text-blurple-500"
                    >
                      {link.label}
                      <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-brand-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-brand-500">© {new Date().getFullYear()} Native. All rights reserved.</p>
          <p className="text-xs font-medium text-brand-500">Built for operators who care about the details.</p>
        </div>
      </div>
    </footer>
  );
}
