'use client';

import Link from 'next/link';
import { ArrowUpRight, Terminal } from 'lucide-react';
import { Reveal, Marquee } from '@/components/reveal';

const LOG = [
  ['12:04:01', 'fork', 'worker-alpha attached socks5://eu-3', 'ok'],
  ['12:04:01', 'auth', 'session restored in 812ms', 'ok'],
  ['12:04:04', 'mod', 'MineAndSell hot-reloaded (fleet-wide)', 'ok'],
  ['12:04:09', 'net', 'endpoint us-11 failed health check', 'warn'],
  ['12:04:09', 'net', 'rerouted 3 workers -> us-12', 'ok'],
  ['12:04:16', 'cron', 'job restock-inventory fanned to 128 bots', 'ok'],
];

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
        <div className="grid gap-16 pb-20 lg:grid-cols-12 lg:gap-10 lg:pb-28">
          <div className="lg:col-span-7">
            <Reveal delay={80}>
              <h1 className="lp-display mt-8 text-[clamp(3.2rem,8.5vw,7rem)] text-ink">
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

            <Reveal delay={320}>
              <dl className="mt-16 grid max-w-2xl grid-cols-2 border-t border-rule sm:grid-cols-4">
                {[
                  ['400+', 'workers'],
                  ['18', 'modules'],
                  ['40ms', 'log latency'],
                  ['99.98%', 'uptime'],
                ].map(([v, k]) => (
                  <div key={k} className="border-b border-r border-rule py-5 pr-4 last:border-r-0">
                    <dt className="lp-display text-3xl text-ink">{v}</dt>
                    <dd className="lp-mono mt-2 text-ink-faint">{k}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={200} className="lg:col-span-5">
            <div className="border border-ink bg-white shadow-[8px_8px_0_#111111]">
              <div className="flex items-center justify-between border-b border-ink px-4 py-3">
                <span className="lp-mono text-ink">fleet.stream</span>
                <span className="lp-mono flex items-center gap-2 text-ember">
                  <span className="h-1.5 w-1.5 animate-pulse bg-ember" />
                  live
                </span>
              </div>

              <div className="divide-y divide-rule font-mono text-[12px]">
                {LOG.map(([time, tag, msg, level], i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-ink-faint">{time}</span>
                    <span
                      className={
                        level === 'warn'
                          ? 'w-12 shrink-0 font-bold uppercase text-ember'
                          : 'w-12 shrink-0 font-bold uppercase text-jade'
                      }
                    >
                      {tag}
                    </span>
                    <span className="text-ink-soft">{msg}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-ink bg-paper-2 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="lp-mono text-ink-soft">cpu 41% · mem 2.7gb · shards 6</span>
                  <span className="lp-mono text-ink">⌘K</span>
                </div>
                <div className="mt-3 flex h-1.5 gap-px">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <span
                      key={i}
                      className={i % 7 === 3 ? 'flex-1 bg-ember' : 'flex-1 bg-ink/15'}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="lp-mono mt-6 text-ink-faint">
              // no polling. server-sent events all the way down.
            </p>
          </Reveal>
        </div>
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
