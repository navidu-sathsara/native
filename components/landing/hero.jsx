'use client';

import Link from 'next/link';
import { ArrowUpRight, Terminal } from 'lucide-react';
import { Reveal, Marquee } from '@/components/reveal';
import { ConsoleMockup } from '@/components/landing/console-mockup';

const SERVERS = ['Hypixel', '2b2t', 'Mineplex', 'Wynncraft', 'Purpur', 'Folia'];

export function Hero() {
  return (
    <section className="relative border-b border-rule pt-28 sm:pt-36" data-testid="hero-section">
      <div className="lp-grid-lines pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full bg-ember/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal delay={80}>
              <h1 className="lp-display text-[clamp(3.2rem,8.5vw,7rem)] text-ink">
                Run four hundred
                <br />
                bots like they are
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10 text-ember">one process.</span>
                  <span className="absolute inset-x-0 bottom-1.5 z-0 h-3 bg-ember/15" aria-hidden="true" />
                </span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-9 max-w-xl text-[17px] leading-relaxed text-ink-soft">
                Native is the control plane for autonomous Minecraft fleets. Fork isolated
                workers, pin them to SOCKS5 routes, hot-reload behaviour scripts and watch
                every log line stream back in real time.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-11 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link href="/login" className="lp-btn justify-center" data-testid="hero-cta-button">
                  Start free — 1 bot
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
                <a href="#platform" className="lp-btn-ghost justify-center" data-testid="hero-secondary-button">
                  <Terminal className="h-4 w-4" strokeWidth={1.5} />
                  See the platform
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={200} className="flex flex-col justify-end lg:col-span-5">
            <dl className="grid grid-cols-2 gap-px border border-rule bg-rule">
              {[
                ['400+', 'concurrent workers'],
                ['18', 'behaviour modules'],
                ['40ms', 'log latency'],
                ['99.98%', 'plane uptime'],
              ].map(([v, k]) => (
                <div key={k} className="bg-paper p-5">
                  <dt className="lp-display text-3xl text-ink">{v}</dt>
                  <dd className="lp-mono mt-2 text-ink-faint">{k}</dd>
                </div>
              ))}
            </dl>
            <p className="lp-mono mt-5 text-ink-faint">
              // no polling. server-sent events all the way down.
            </p>
          </Reveal>
        </div>

        {/* Real console preview */}
        <Reveal delay={280} className="mt-20 pb-24 lg:mt-24 lg:pb-28">
          <div className="mb-5 flex items-end justify-between gap-4">
            <p className="lp-mono text-ink-soft">The console — /overview</p>
            <p className="lp-mono hidden text-ink-faint sm:block">not a mockup you cannot use. this is the product.</p>
          </div>
          <ConsoleMockup />
        </Reveal>
      </div>

      <div className="relative border-t border-rule bg-paper-2 py-5">
        <Marquee duration={44}>
          {SERVERS.concat(SERVERS).map((name, i) => (
            <span key={`${name}-${i}`} className="lp-mono flex items-center gap-10 pr-10 text-ink-soft">
              {name}
              <span className="text-ember">*</span>
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
