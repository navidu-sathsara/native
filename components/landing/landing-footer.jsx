'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/reveal';
import { NoraLogo } from '@/components/nora-logo';

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Overview', href: '#platform' },
      { label: 'Workflow', href: '#workflow' },
      { label: 'Registry', href: '#registry' },
      { label: 'Pricing', href: '#pricing' },
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
      { label: 'Module registry', href: '#registry' },
      { label: 'Status', href: '#faq' },
      { label: 'Changelog', href: '#faq' },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-ink bg-ink text-white" data-testid="landing-footer">
      {/* Closing CTA */}
      <div className="border-b border-white/12">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <p className="lp-mono flex items-center gap-3 text-ember">
              <span className="h-1.5 w-1.5 bg-ember" />
              Ready when you are
            </p>
            <h2 className="lp-display mt-8 text-[clamp(2.8rem,6.5vw,5.5rem)] text-white">
              Run the fleet.
              <br />
              <span className="text-white/35">Not the chaos.</span>
            </h2>
          </Reveal>

          <Reveal delay={120} className="flex flex-col justify-end gap-4 lg:col-span-5 lg:items-end">
            <p className="max-w-sm text-[15px] leading-relaxed text-white/55 lg:text-right">
              One bot, free, forever. Spin up the console and fork your first worker in
              under two seconds.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="lp-btn justify-center" data-testid="footer-cta-button">
                Launch console
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
              <a
                href="#pricing"
                data-testid="footer-pricing-link"
                className="lp-mono inline-flex items-center justify-center gap-2 border border-white/40 px-6 py-4 text-white transition-colors duration-150 hover:bg-white hover:text-ink"
              >
                Compare plans
              </a>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Oversized wordmark */}
      <div className="overflow-hidden border-b border-white/12">
        <p className="lp-display select-none px-5 pb-2 pt-8 text-[19vw] leading-[0.8] text-white/[0.07] sm:px-8">
          NATIVE
        </p>
      </div>

      {/* Link columns */}
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="lp-display text-2xl text-white">Native</span>
            </div>
            <p className="mt-6 max-w-xs text-[14px] leading-relaxed text-white/55">
              The control plane for autonomous fleets. Deploy, orchestrate and observe
              hundreds of bots from one obsessively designed console.
            </p>
            <div className="lp-mono mt-7 inline-flex items-center gap-2 border border-white/20 px-3 py-2 text-white/70">
              <span className="h-1.5 w-1.5 bg-jade" />
              All systems operational
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="lp-mono text-white/40">{column.title}</p>
              <ul className="mt-6 space-y-4">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-[14px] text-white/70 transition-colors duration-150 hover:text-ember"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="lp-mono mt-16 flex flex-col gap-3 border-t border-white/12 pt-8 text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Native</p>
          <p>Built for operators who care about the details</p>
        </div>
      </div>
    </footer>
  );
}
