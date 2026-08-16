'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Activity, Bot, Braces, CalendarClock, Command, Network,
  Check, ArrowRight, Minus, Plus, ChevronDown
} from 'lucide-react';
import { Reveal, Marquee } from '@/components/reveal';
import { cn } from '@/lib/api';

/* ------------------------------------------------------------------ */

export function SectionHead({ eyebrow, title, sub, align = 'left' }) {
  return (
    <Reveal className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && (
        <p className="stripe-badge mb-6">
          {eyebrow}
        </p>
      )}
      <h2 className="text-4xl md:text-5xl font-bold text-brand-900 tracking-tight leading-tight">{title}</h2>
      {sub && <p className="mt-6 text-lg leading-relaxed text-brand-600">{sub}</p>}
    </Reveal>
  );
}

/* ---------------------------- Features ---------------------------- */

const FEATURES = [
  {
    icon: Bot,
    title: 'Fleet orchestration',
    body: 'Spawn, restart and retire hundreds of isolated bot processes. Each worker forks with its own config, credentials and lifecycle.',
    span: 'lg:col-span-3 lg:row-span-2',
    feature: true,
  },
  {
    icon: Network,
    title: 'Proxy network',
    body: 'SOCKS5 pools with health checks, automatic assignment and a hard capacity ceiling of three workers per endpoint.',
    span: 'lg:col-span-3',
  },
  {
    icon: Activity,
    title: 'Live telemetry',
    body: 'Server-sent events push status, logs and shard health into the console with sub-40ms latency.',
    span: 'lg:col-span-2',
  },
  {
    icon: Braces,
    title: 'Script engine',
    body: 'Author, version and hot-reload behaviour scripts without restarting a single worker.',
    span: 'lg:col-span-2',
  },
  {
    icon: CalendarClock,
    title: 'Schedules',
    body: 'Cron-style jobs that fan out across the fleet and report back per-bot results.',
    span: 'lg:col-span-2',
  },
  {
    icon: Command,
    title: 'Command palette',
    body: 'Cmd K from anywhere. Navigate, search and fire fleet-wide commands without lifting your hands.',
    span: 'lg:col-span-6',
  },
];

export function FeatureBento() {
  return (
    <section id="platform" className="relative mx-auto max-w-7xl px-6 py-28 sm:py-36">
      <SectionHead
        eyebrow="The platform"
        title={<>Everything the fleet needs.<br /><span className="text-brand-400">Nothing it does not.</span></>}
        sub="Six surfaces, one mental model. Every screen shares the same glass language, the same keyboard grammar and the same real-time spine."
      />

      <div className="mt-16 grid gap-6 lg:grid-cols-6">
        {FEATURES.map((item, i) => {
          const Icon = item.icon;
          return (
            <Reveal
              key={item.title}
              delay={i * 70}
              className={cn('bento-card group flex flex-col', item.span)}
            >
              <div className="h-12 w-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-blurple-500 mb-6 transition-transform group-hover:scale-105">
                <Icon className="h-6 w-6" />
              </div>

              <h3 className="text-xl font-bold text-brand-900">{item.title}</h3>
              <p className="mt-3 text-brand-600 leading-relaxed">{item.body}</p>

              {item.feature && (
                <div className="mt-10 overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm flex-1">
                  <div className="flex items-center justify-between border-b border-brand-100 bg-brand-50 px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-brand-600">fleet.status</span>
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blurple-600">
                      <span className="h-2 w-2 rounded-full bg-blurple-500 animate-pulse" />
                      streaming
                    </span>
                  </div>
                  <div className="space-y-3 p-5">
                    {[
                      ['worker-alpha', 'running', 100],
                      ['worker-beta', 'running', 92],
                      ['worker-gamma', 'pending', 48],
                      ['worker-delta', 'running', 78],
                      ['worker-epsilon', 'stopped', 12],
                    ].map(([name, state, pct]) => (
                      <div key={name} className="flex items-center gap-4">
                        <span className="w-24 shrink-0 font-mono text-xs font-medium text-brand-700">{name}</span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-100">
                          <span
                            className="block h-full rounded-full bg-blurple-500 transition-[width] duration-1000 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <span className="w-16 shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-brand-500">{state}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export function WaveDivider({ position = 'bottom', fill = 'fill-white' }) {
  return (
    <div className={cn("absolute inset-x-0 w-full overflow-hidden leading-none z-10", position === 'top' ? 'top-0 rotate-180' : 'bottom-0')}>
      <svg className="relative block w-full h-[30px] md:h-[60px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className={fill}></path>
      </svg>
    </div>
  );
}

/* ---------------------------- Workflow ---------------------------- */

const STEPS = [
  { n: '01', t: 'Provision', d: 'Add an account, pick a target server and attach a proxy endpoint. The worker forks in under two seconds.' },
  { n: '02', t: 'Compose', d: 'Toggle modules, bind aliases and drop in a behaviour script. Everything hot-reloads without a restart.' },
  { n: '03', t: 'Schedule', d: 'Queue recurring jobs that fan out across the fleet and report per-bot results back to the activity log.' },
  { n: '04', t: 'Observe', d: 'Stream every log line, status change and inventory delta live. Intervene from the console at any moment.' },
];

export function Workflow() {
  return (
    <section id="workflow" className="relative bg-brand-50 py-28 sm:py-36">
      <WaveDivider position="top" fill="fill-white" />
      <div className="mx-auto max-w-7xl px-6 relative z-20">
        <SectionHead
          eyebrow="How it works"
          title={<>Four steps from<br /><span className="text-brand-400">zero to fleet.</span></>}
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal
              key={step.n}
              delay={i * 90}
              className="bg-white rounded-xl p-8 border border-brand-100 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
            >
              <span className="inline-block px-3 py-1 bg-blurple-500/10 text-blurple-600 rounded-full text-xs font-bold tracking-widest mb-6">{step.n}</span>
              <h3 className="text-xl font-bold text-brand-900 mb-3">{step.t}</h3>
              <p className="text-brand-600 leading-relaxed">{step.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
      <WaveDivider position="bottom" fill="fill-white" />
    </section>
  );
}

/* ---------------------------- Stats ---------------------------- */

const STATS = [
  ['400+', 'Concurrent workers'],
  ['1200', 'Log lines buffered'],
  ['18', 'Behaviour modules'],
  ['99.98%', 'Control plane uptime'],
];

export function StatsBand() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(([value, label], i) => (
          <Reveal key={label} delay={i * 80} className="text-center p-8 bg-white border border-brand-100 rounded-2xl shadow-sm">
            <p className="text-5xl font-bold text-brand-900 tracking-tight">{value}</p>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-brand-500">{label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- Modules marquee ---------------------------- */

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
    <span
      key={`${name}-${i}`}
      className="mr-4 inline-flex shrink-0 items-center gap-3 rounded-full border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow-sm transition-all hover:border-blurple-500 hover:text-blurple-600 hover:shadow-md"
    >
      <span className="h-2 w-2 rounded-full bg-blurple-500/40" />
      {name}
    </span>
  );

  return (
    <section className="py-24 overflow-hidden relative">
      <div className="absolute inset-0 bg-brand-50/50 -z-10" />
      <div className="mx-auto mb-16 max-w-7xl px-6">
        <SectionHead
          eyebrow="Module registry"
          title="Composable behaviour."
          sub="Every worker is assembled from independent modules. Toggle them per bot, per workspace, or fleet-wide."
          align="center"
        />
      </div>
      <div className="space-y-6 flex flex-col items-center">
        <Marquee duration={50}>{MODULES_ROW1.map(chip)}</Marquee>
        <Marquee duration={60} reverse>{MODULES_ROW2.map(chip)}</Marquee>
      </div>
    </section>
  );
}

/* ---------------------------- Testimonials ---------------------------- */

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
    <section className="mx-auto max-w-7xl px-6 py-28 sm:py-36">
      <SectionHead eyebrow="In production" title="Built for operators." align="center" />

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        {QUOTES.map((item, i) => (
          <Reveal key={item.a} delay={i * 90} className="bento-card flex flex-col p-8">
            <div className="text-blurple-500/20 mb-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.748 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z" />
              </svg>
            </div>
            <p className="flex-1 text-lg font-medium leading-relaxed text-brand-800">{item.q}</p>
            <div className="mt-8 pt-6 border-t border-brand-100">
              <p className="font-bold text-brand-900">{item.a}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-brand-500">{item.r}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- Pricing ---------------------------- */

const PLANS = [
  {
    name: 'Starter',
    price: '$0',
    badge: 'Always Free',
    note: 'Perfect to test autonomous bots',
    features: ['1 Bot running concurrently', 'Admin Free Proxy access only', 'Live Web Console', 'Standard module access'],
    cta: 'Start for free',
    featured: false,
    gold: false,
  },
  {
    name: 'Pro',
    price: '$15',
    unit: '/mo',
    badge: 'Most Popular',
    note: 'Popular for serious bot operations',
    features: ['Up to 10 bots running', 'Private SOCKS5 proxy pools', 'Visual Command & Script Builder', 'Scheduled automation'],
    cta: 'Get started',
    featured: true,
    gold: false,
  },
  {
    name: 'Enterprise',
    price: '$99',
    unit: '/mo',
    badge: 'Unlimited Scale',
    note: 'Massive scale for huge fleets',
    features: ['Unlimited bots running', 'Dedicated proxy endpoints', 'Mass Broadcast commands', '24/7 VIP priority support'],
    cta: 'Contact sales',
    featured: false,
    gold: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-28 sm:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-brand-900 -z-20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,91,255,0.15),transparent_70%)] -z-10"></div>
      <WaveDivider position="top" fill="fill-white" />
      
      <div className="mx-auto max-w-7xl px-6 relative z-20">
        <Reveal className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">Predictable pricing.</h2>
          <p className="mt-6 text-lg text-brand-200">No hidden overages or complicated seat formulas. Scale your fleet with confidence.</p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <Reveal
              key={plan.name}
              delay={i * 80}
              className={cn(
                'relative flex flex-col justify-between rounded-2xl p-8 transition-transform duration-500 hover:-translate-y-2',
                plan.featured
                  ? 'bg-white shadow-2xl border-2 border-blurple-500 md:-my-4'
                  : 'bg-brand-800 border border-brand-700'
              )}
            >
              {plan.badge && (
                <div className="mb-6">
                  <span
                    className={cn(
                      'inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase',
                      plan.featured
                        ? 'bg-blurple-500 text-white'
                        : 'bg-brand-700 text-brand-200'
                    )}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              <div>
                <p className={cn("text-xl font-bold", plan.featured ? "text-brand-900" : "text-white")}>{plan.name}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className={cn("text-5xl font-extrabold tracking-tight", plan.featured ? "text-brand-900" : "text-white")}>{plan.price}</span>
                  {plan.unit && <span className={cn("text-lg", plan.featured ? "text-brand-500" : "text-brand-400")}>{plan.unit}</span>}
                </div>
                <p className={cn("mt-4 text-sm", plan.featured ? "text-brand-600" : "text-brand-300")}>{plan.note}</p>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={cn("h-5 w-5 shrink-0", plan.featured ? "text-blurple-500" : "text-blurple-400")} />
                      <span className={cn("text-sm font-medium", plan.featured ? "text-brand-700" : "text-brand-200")}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/login"
                className={cn(
                  'mt-10 w-full inline-flex h-12 items-center justify-center rounded-xl text-base font-bold transition-all',
                  plan.featured
                    ? 'bg-blurple-500 text-white hover:bg-blurple-600 shadow-md hover:shadow-lg'
                    : 'bg-white text-brand-900 hover:bg-brand-50'
                )}
              >
                {plan.cta}
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
      <WaveDivider position="bottom" fill="fill-white" />
    </section>
  );
}

/* ---------------------------- FAQ ---------------------------- */

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
    <section id="faq" className="mx-auto max-w-4xl px-6 py-28 sm:py-36">
      <SectionHead
        eyebrow="Questions"
        title="Frequently asked questions."
        align="center"
      />

      <div className="mt-16 divide-y divide-brand-200 border-y border-brand-200">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={item.q} delay={i * 60}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="group flex w-full items-center justify-between py-6 text-left focus:outline-none"
              >
                <span className="text-lg font-semibold text-brand-900 group-hover:text-blurple-600 transition-colors">
                  {item.q}
                </span>
                <span className="ml-6 flex items-center justify-center">
                  <ChevronDown className={cn("h-5 w-5 text-brand-500 transition-transform duration-300", isOpen && "rotate-180")} />
                </span>
              </button>
              <div
                className="grid transition-all duration-300 ease-in-out"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
              >
                <div className="overflow-hidden">
                  <p className="pb-6 pr-12 text-base leading-relaxed text-brand-600">{item.a}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
