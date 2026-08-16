'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Activity, Bot, Braces, CalendarClock, Command, Network,
  Check, ArrowUpRight, Minus, Plus,
} from 'lucide-react';
import { Reveal, Marquee } from '@/components/reveal';
import { cn } from '@/lib/api';

/* ------------------------------- Head ------------------------------- */

export function SectionHead({ index, eyebrow, title, sub, className }) {
  return (
    <Reveal className={cn('max-w-3xl', className)}>
      <div className="flex items-center gap-4">
        {index && <span className="lp-mono text-ember">{index}</span>}
        {eyebrow && <span className="lp-mono text-ink-soft">{eyebrow}</span>}
        <span className="h-px flex-1 bg-ink/12" />
      </div>
      <h2 className="lp-display mt-7 text-[clamp(2.4rem,5vw,4.2rem)] text-ink">{title}</h2>
      {sub && <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft">{sub}</p>}
    </Reveal>
  );
}

/* ------------------------------ Features ------------------------------ */

const FEATURES = [
  {
    icon: Bot,
    title: 'Fleet orchestration',
    body: 'Spawn, restart and retire hundreds of isolated bot processes. Each worker forks with its own config, credentials and lifecycle.',
    span: 'md:col-span-4 md:row-span-2',
    panel: true,
  },
  {
    icon: Network,
    title: 'Proxy network',
    body: 'SOCKS5 pools with health checks, automatic assignment and a hard ceiling of three workers per endpoint.',
    span: 'md:col-span-2',
  },
  {
    icon: Activity,
    title: 'Live telemetry',
    body: 'Server-sent events push status, logs and shard health into the console with sub-40ms latency.',
    span: 'md:col-span-2',
  },
  {
    icon: Braces,
    title: 'Script engine',
    body: 'Author, version and hot-reload behaviour scripts without restarting a single worker.',
    span: 'md:col-span-2',
  },
  {
    icon: CalendarClock,
    title: 'Schedules',
    body: 'Cron-style jobs that fan out across the fleet and report back per-bot results.',
    span: 'md:col-span-2',
  },
  {
    icon: Command,
    title: 'Command palette',
    body: 'Cmd K from anywhere. Navigate, search and fire fleet-wide commands without lifting your hands.',
    span: 'md:col-span-2',
  },
];

export function FeatureBento() {
  return (
    <section id="platform" className="border-b border-rule py-24 sm:py-32" data-testid="features-section">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <SectionHead
          index="01"
          eyebrow="The platform"
          title={<>Everything the fleet needs. <span className="text-ink-faint">Nothing it does not.</span></>}
          sub="Six surfaces, one mental model. Every screen shares the same keyboard grammar and the same real-time spine."
        />

        <div className="mt-16 grid grid-cols-1 gap-px border border-rule bg-rule md:grid-cols-6">
          {FEATURES.map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal
                key={item.title}
                delay={i * 60}
                data-testid={`feature-card-${i}`}
                className={cn(
                  'group flex flex-col bg-paper p-8 transition-colors duration-200 hover:bg-white lg:p-10',
                  item.span
                )}
              >
                <div className="flex items-start justify-between">
                  <Icon className="h-6 w-6 text-ember" strokeWidth={1.5} />
                  <span className="lp-mono text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
                </div>

                <h3 className="lp-display mt-8 text-2xl text-ink">{item.title}</h3>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">{item.body}</p>

                {item.panel && (
                  <div className="mt-10 flex-1 border border-ink/15 bg-white">
                    <div className="flex items-center justify-between border-b border-ink/15 px-4 py-2.5">
                      <span className="lp-mono text-ink-soft">fleet.status</span>
                      <span className="lp-mono text-jade">streaming</span>
                    </div>
                    <div className="space-y-4 p-5">
                      {[
                        ['worker-alpha', 'running', 100],
                        ['worker-beta', 'running', 92],
                        ['worker-gamma', 'pending', 48],
                        ['worker-delta', 'running', 78],
                        ['worker-epsilon', 'stopped', 12],
                      ].map(([name, state, pct]) => (
                        <div key={name} className="flex items-center gap-4">
                          <span className="w-28 shrink-0 font-mono text-[11px] text-ink">{name}</span>
                          <span className="h-1 flex-1 bg-ink/10">
                            <span
                              className={cn('block h-full', state === 'stopped' ? 'bg-ink/30' : 'bg-ember')}
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                          <span className="lp-mono w-16 shrink-0 text-right text-ink-faint">{state}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Workflow ------------------------------ */

const STEPS = [
  { n: '01', t: 'Provision', d: 'Add an account, pick a target server and attach a proxy endpoint. The worker forks in under two seconds.' },
  { n: '02', t: 'Compose', d: 'Toggle modules, bind aliases and drop in a behaviour script. Everything hot-reloads without a restart.' },
  { n: '03', t: 'Schedule', d: 'Queue recurring jobs that fan out across the fleet and report per-bot results to the activity log.' },
  { n: '04', t: 'Observe', d: 'Stream every log line, status change and inventory delta live. Intervene from the console at any moment.' },
];

export function Workflow() {
  return (
    <section id="workflow" className="border-b border-rule bg-paper-2 py-24 sm:py-32" data-testid="workflow-section">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHead
              index="02"
              eyebrow="How it works"
              title={<>Zero to fleet<br />in four moves.</>}
            />
            <Link href="/login" className="lp-btn mt-10 inline-flex" data-testid="workflow-cta-button">
              Provision a worker
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>

          <div className="lg:col-span-8">
            <ol className="border-t border-ink/15">
              {STEPS.map((step, i) => (
                <Reveal
                  key={step.n}
                  delay={i * 70}
                  as="li"
                  data-testid={`workflow-step-${step.n}`}
                  className="group grid grid-cols-1 gap-4 border-b border-ink/15 py-8 sm:grid-cols-12 sm:gap-8"
                >
                  <span className="lp-mono text-ember sm:col-span-1">{step.n}</span>
                  <h3 className="lp-display text-3xl text-ink transition-colors duration-200 group-hover:text-ember sm:col-span-4">
                    {step.t}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-ink-soft sm:col-span-7">{step.d}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Stats -------------------------------- */

const STATS = [
  ['400+', 'Concurrent workers', 'peak observed on a single control service'],
  ['1200', 'Log lines buffered', 'per bot, in the browser, no polling'],
  ['18', 'Behaviour modules', 'composable per bot or fleet-wide'],
  ['99.98%', 'Control plane uptime', 'trailing twelve months'],
];

export function StatsBand() {
  return (
    <section className="border-b border-rule bg-ink py-20 text-white sm:py-24" data-testid="stats-section">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-px bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map(([value, label, note], i) => (
            <Reveal key={label} delay={i * 70} className="bg-ink p-8" data-testid={`stat-${i}`}>
              <p className="lp-display text-[clamp(2.6rem,4vw,3.6rem)] text-white">{value}</p>
              <p className="lp-mono mt-4 text-ember">{label}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-white/45">{note}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Module registry ---------------------------- */

const MODULES_ROW1 = [
  'AutoAuth', 'AutoHome', 'BoneCollector', 'BoneDropper', 'BoxPvpMiner', 'ChatGames',
  'CrystalTrap', 'DiscordBridge',
];

const MODULES_ROW2 = [
  'Fight', 'Follower', 'GoTo', 'GuiManager',
  'InventoryCleaner', 'MineAndSell', 'PayoutBridge', 'TpKiller',
];

export function ModulesMarquee() {
  const chip = (name, i) => (
    <span key={`${name}-${i}`} className="lp-mono flex shrink-0 items-center gap-8 pr-8 text-ink">
      {name}
      <span className="text-ember">{i % 2 === 0 ? '//' : '+'}</span>
    </span>
  );

  return (
    <section id="registry" className="border-b border-rule py-24 sm:py-32" data-testid="registry-section">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <SectionHead
          index="03"
          eyebrow="Module registry"
          title="Composable behaviour."
          sub="Every worker is assembled from independent modules. Toggle them per bot, per workspace, or fleet-wide — no redeploy, no restart."
        />
      </div>

      <div className="mt-14 space-y-px border-y border-ink/15 bg-ink/15">
        <div className="bg-paper-2 py-6">
          <Marquee duration={52}>{MODULES_ROW1.map(chip)}</Marquee>
        </div>
        <div className="bg-paper-2 py-6">
          <Marquee duration={62} reverse>{MODULES_ROW2.map(chip)}</Marquee>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Testimonials ----------------------------- */

const QUOTES = [
  {
    q: 'We went from three terminal windows and a spreadsheet to one console. The live log stream alone paid for itself in the first week.',
    a: 'Fleet operator',
    r: 'Running 120 workers',
  },
  {
    q: 'The proxy pool health checks catch dead endpoints before a single bot notices. That used to be an hour of manual triage every morning.',
    a: 'Infrastructure lead',
    r: 'Managing 40 endpoints',
  },
  {
    q: 'Hot-reloading scripts across the whole fleet without a restart is the feature I did not know I needed. Now I cannot work without it.',
    a: 'Automation engineer',
    r: 'Shipping daily',
  },
];

export function Testimonials() {
  return (
    <section className="border-b border-rule py-24 sm:py-32" data-testid="testimonials-section">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <SectionHead index="04" eyebrow="In production" title="Built for operators." />

        <div className="mt-16 grid gap-px border border-ink/15 bg-ink/15 lg:grid-cols-3">
          {QUOTES.map((item, i) => (
            <Reveal
              key={item.a}
              delay={i * 80}
              data-testid={`testimonial-${i}`}
              className="flex flex-col bg-paper p-8 transition-colors duration-200 hover:bg-white lg:p-10"
            >
              <span className="lp-display text-5xl leading-none text-ember">&ldquo;</span>
              <p className="mt-4 flex-1 text-[17px] leading-relaxed text-ink">{item.q}</p>
              <div className="mt-10 border-t border-ink/15 pt-5">
                <p className="lp-display text-lg text-ink">{item.a}</p>
                <p className="lp-mono mt-2 text-ink-faint">{item.r}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Pricing -------------------------------- */

const PLANS = [
  {
    name: 'Free Starter',
    planId: 'free',
    price: '$0',
    badge: 'Always Free',
    note: 'Perfect to test autonomous bots and basic grinds.',
    features: [
      '1 Minecraft Bot running concurrently',
      'Admin Free Proxy access only',
      'Live Web Console & Inventory view',
      'Anti-AFK & standard behaviors'
    ],
    cta: 'Start for Free',
  },
  {
    name: 'Bronze Pro',
    planId: 'bronze_3',
    price: '$2',
    unit: '/mo',
    badge: 'Starter Squad',
    note: 'Ideal for personal farms and small squads.',
    features: [
      'Up to 3 Minecraft Bots running',
      'Use any private SOCKS5 proxies',
      'All Behavior Modules enabled',
      'Fast console streaming latency'
    ],
    cta: 'Get Bronze Pro ($2)',
  },
  {
    name: 'Silver Pro',
    planId: 'silver_5',
    price: '$5',
    unit: '/mo',
    badge: 'Most Popular',
    note: 'For serious bot operators and faction clans.',
    features: [
      'Up to 10 Minecraft Bots running',
      'Custom SOCKS5 Proxy pool support',
      'Visual Command & Script Builder',
      'Scheduled actions & Auto-reconnect'
    ],
    cta: 'Get Silver Pro ($5)',
    featured: true,
  },
  {
    name: 'Unlimited Pro',
    planId: 'unlimited_15',
    price: '$12',
    unit: '/mo',
    badge: 'Enterprise Fleet',
    note: 'Uncapped power for massive multi-server ops.',
    features: [
      'Unlimited (∞) Minecraft Bots running',
      'Dedicated & Custom SOCKS5 Proxies',
      'Mass Broadcast & Custom Aliases',
      '24/7 Priority compute sandboxes'
    ],
    cta: 'Get Unlimited ($12)',
    dark: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-rule bg-paper-2 py-24 sm:py-32" data-testid="pricing-section">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <SectionHead
          index="05"
          eyebrow="Pricing & Fleet Capacity"
          title="Simple, transparent plans."
          sub="No hidden overages or seat formulas. Choose a plan or grab our limited-time flash discount."
        />

        {/* ── LIMITED TIME FLASH DEAL BANNER ────────────────────── */}
        <div className="mt-12 border-2 border-ember bg-white p-6 sm:p-8 shadow-[6px_6px_0_#ff4400]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="border border-ember bg-ember text-white px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider">
                  🔥 LIMITED FLASH DEAL · 40% OFF
                </span>
                <span className="text-xs font-mono text-ember font-bold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-ember animate-ping" />
                  Special Offer Active
                </span>
              </div>
              <h3 className="lp-display text-2xl sm:text-3xl font-bold text-ink">
                Flash Fleet Special — 20 Bots + 10 Dedicated Proxies
              </h3>
              <p className="text-sm font-mono text-ink-soft max-w-2xl">
                Deploy 20 concurrent Minecraft bots with 10 dedicated premium SOCKS5 proxies, Anti-AFK & auto-mining modules for just $6.99/mo.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
              <div className="text-left sm:text-right">
                <span className="text-xs font-mono text-ink-faint line-through block font-bold">$15.00/mo</span>
                <span className="lp-display text-4xl font-bold text-ink">$6.99</span>
                <span className="text-xs font-mono text-ink-soft ml-1">/ month</span>
              </div>
              <Link
                href="/login?plan=promo_flash_starter"
                className="lp-mono inline-flex items-center justify-center gap-2 border border-ink bg-ember px-6 py-4 text-white font-bold hover:bg-ember-dark transition shadow-[3px_3px_0_#111111]"
              >
                Claim Flash Deal
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-px border border-ink bg-ink md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan, i) => (
            <Reveal
              key={plan.name}
              delay={i * 70}
              data-testid={`pricing-card-${plan.name.toLowerCase()}`}
              className={cn(
                'flex flex-col p-8 lg:p-10',
                plan.dark ? 'bg-ink text-white' : 'bg-paper',
                plan.featured && 'bg-white'
              )}
            >
              <div className="flex items-center justify-between">
                <p className="lp-display text-xl">{plan.name}</p>
                <span
                  className={cn(
                    'lp-mono px-2.5 py-1 text-xs',
                    plan.featured
                      ? 'bg-ember text-white'
                      : plan.dark
                        ? 'border border-white/25 text-white/70'
                        : 'border border-ink/20 text-ink-soft'
                  )}
                >
                  {plan.badge}
                </span>
              </div>

              <div className="mt-8 flex items-baseline gap-2">
                <span className="lp-display text-[clamp(2.5rem,4vw,3.5rem)]">{plan.price}</span>
                {plan.unit && (
                  <span className={cn('lp-mono', plan.dark ? 'text-white/50' : 'text-ink-faint')}>{plan.unit}</span>
                )}
              </div>

              <p className={cn('mt-4 text-[14px]', plan.dark ? 'text-white/60' : 'text-ink-soft')}>{plan.note}</p>

              <ul className={cn('mt-9 space-y-3.5 border-t pt-8 font-mono text-xs', plan.dark ? 'border-white/15' : 'border-ink/12')}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ember" strokeWidth={1.5} />
                    <span className={cn(plan.dark ? 'text-white/80' : 'text-ink')}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.planId === 'free' ? '/login' : `/login?plan=${plan.planId}`}
                data-testid={`pricing-cta-${plan.name.toLowerCase()}`}
                className={cn(
                  'lp-mono mt-10 inline-flex items-center justify-center gap-2 border px-6 py-3.5 text-xs font-bold transition-colors duration-150',
                  plan.featured
                    ? 'border-ink bg-ember text-white hover:bg-ember-dark'
                    : plan.dark
                      ? 'border-white text-white hover:bg-white hover:text-ink'
                      : 'border-ink text-ink hover:bg-ink hover:text-paper'
                )}
              >
                {plan.cta}
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- FAQ ---------------------------------- */

const FAQS = [
  {
    q: 'What exactly does Native run?',
    a: 'Native is a control plane for headless Minecraft clients. Each bot forks as an isolated Node process with its own credentials, proxy route, module set and log buffer, supervised by a single control service.',
  },
  {
    q: 'How are proxies handled?',
    a: 'You register SOCKS5 endpoints in the network page. Native health-checks them on demand or in bulk, then assigns workers automatically with a hard ceiling of three bots per endpoint so no single route gets saturated.',
  },
  {
    q: 'Can multiple people share a workspace?',
    a: 'Yes. Users have roles, and every bot, script, alias and schedule is scoped to a workspace. Admins see the users page and can reassign ownership of any worker.',
  },
  {
    q: 'Is the console really real time?',
    a: 'Everything streams over server-sent events. Fleet-level status, per-bot logs, inventory refreshes and job results all push to the browser without polling. The client keeps the last 1,200 log lines per bot.',
  },
  {
    q: 'Do I need to restart bots to change behaviour?',
    a: 'No. Modules toggle live, aliases sync instantly and behaviour scripts hot-reload across the fleet. Restarts are reserved for credential or target-server changes.',
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="py-24 sm:py-32" data-testid="faq-section">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHead index="06" eyebrow="Questions" title={<>Frequently<br />asked.</>} />
          </div>

          <div className="lg:col-span-8">
            <div className="border-t border-ink/15">
              {FAQS.map((item, i) => {
                const isOpen = open === i;
                return (
                  <div key={item.q} className="border-b border-ink/15">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? -1 : i)}
                      data-testid={`faq-toggle-${i}`}
                      className="group flex w-full items-center justify-between gap-6 py-7 text-left focus:outline-none focus:ring-2 focus:ring-ember"
                    >
                      <span className="lp-display text-xl text-ink transition-colors duration-200 group-hover:text-ember sm:text-2xl">
                        {item.q}
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-ink/25 text-ink transition-colors duration-200 group-hover:border-ember group-hover:text-ember">
                        {isOpen
                          ? <Minus className="h-4 w-4" strokeWidth={1.5} />
                          : <Plus className="h-4 w-4" strokeWidth={1.5} />}
                      </span>
                    </button>
                    <div
                      className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
                      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
                    >
                      <div className="overflow-hidden">
                        <p className="max-w-2xl pb-8 text-[16px] leading-relaxed text-ink-soft">{item.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
