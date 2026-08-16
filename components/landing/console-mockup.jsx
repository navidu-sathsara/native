'use client';

import {
  Activity, Bot, Braces, CalendarClock, Command, Gauge, LayoutGrid,
  Network, Settings, Zap, Play, Square, Search, TrendingUp, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/api';

const NAV = [
  {
    group: 'Workspace',
    items: [
      { label: 'Dashboard', icon: Gauge, active: true },
      { label: 'Instances', icon: Bot, count: '140' },
      { label: 'Fleet Grid', icon: LayoutGrid },
      { label: 'Network', icon: Network, count: '40' },
    ],
  },
  {
    group: 'Automation',
    items: [
      { label: 'Commands', icon: Command },
      { label: 'Routines', icon: Braces },
      { label: 'Cron Jobs', icon: CalendarClock, count: '6' },
      { label: 'Event Logs', icon: Activity },
    ],
  },
  {
    group: 'Account',
    items: [
      { label: 'Billing', icon: Zap },
      { label: 'Preferences', icon: Settings },
    ],
  },
];

const STATS = [
  { label: 'Global bots', value: '128 / 140', hint: '12 stopped · 0 errors', icon: Bot },
  { label: 'Proxy pool', value: '38 / 40', hint: '2 endpoints re-routing', icon: Network, warn: true },
  { label: 'Fleet shards', value: '1,284,905', hint: 'total balance mined', icon: Sparkles },
  { label: 'Platform MRR', value: '$4,180', hint: '84 paid of 610 accounts', icon: TrendingUp },
];

const WORKERS = [
  ['worker-alpha', 'Hypixel', 'eu-3', 'running', '14d 02h', '182,400'],
  ['worker-beta', '2b2t', 'eu-7', 'running', '9d 21h', '96,120'],
  ['worker-gamma', 'Mineplex', 'us-12', 'pending', '00h 04m', '0'],
  ['worker-delta', 'Wynncraft', 'us-4', 'running', '3d 11h', '41,880'],
  ['worker-epsilon', 'Purpur', 'ap-1', 'stopped', '—', '12,006'],
];

const EVENTS = [
  ['12:04', 'MineAndSell hot-reloaded fleet-wide', 'ok'],
  ['12:04', 'endpoint us-11 failed health check', 'warn'],
  ['12:04', 'rerouted 3 workers → us-12', 'ok'],
  ['12:03', 'cron restock-inventory → 128 bots', 'ok'],
  ['12:03', 'worker-zeta session restored 812ms', 'ok'],
];

function statusTone(state) {
  if (state === 'running') return 'border-jade/40 bg-jade/10 text-jade';
  if (state === 'pending') return 'border-ember/40 bg-ember/10 text-ember';
  return 'border-ink/20 bg-ink/5 text-ink-faint';
}

export function ConsoleMockup() {
  return (
    <div
      className="border border-ink bg-white shadow-[10px_10px_0_#111111]"
      role="img"
      aria-label="Native console dashboard preview"
      data-testid="console-mockup"
    >
      {/* Top chrome */}
      <div className="flex items-center gap-4 border-b border-ink px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 border border-ink bg-ember" />
          <span className="lp-mono text-ink">native / fleet-eu</span>
        </div>

        <div className="ml-2 hidden flex-1 items-center gap-2 border border-ink/15 bg-paper-2 px-3 py-1.5 sm:flex">
          <Search className="h-3 w-3 text-ink-faint" strokeWidth={1.5} />
          <span className="lp-mono text-ink-faint">Search bots, scripts, aliases</span>
          <span className="lp-mono ml-auto border border-ink/20 px-1.5 py-0.5 text-ink-soft">⌘K</span>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <span className="lp-mono border border-ink px-2 py-1 text-ink">Pro tier</span>
          <span className="flex h-6 w-6 items-center justify-center bg-ink lp-mono text-white">n</span>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-[186px] shrink-0 border-r border-ink/15 bg-paper-2 py-5 lg:block">
          {NAV.map((section) => (
            <div key={section.group} className="mb-6 px-3 last:mb-0">
              <p className="lp-mono px-2 text-ink-faint">{section.group}</p>
              <ul className="mt-2.5 space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.label}
                      className={cn(
                        'flex items-center gap-2.5 border-l-2 px-2 py-1.5 text-[12px]',
                        item.active
                          ? 'border-ember bg-white font-semibold text-ink'
                          : 'border-transparent text-ink-soft'
                      )}
                    >
                      <Icon className={cn('h-3.5 w-3.5', item.active && 'text-ember')} strokeWidth={1.5} />
                      {item.label}
                      {item.count && <span className="lp-mono ml-auto text-ink-faint">{item.count}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="flex items-end justify-between gap-4 px-5 pb-5 pt-6">
            <div>
              <p className="lp-mono text-ink-faint">Command HQ · super administrator</p>
              <p className="lp-display mt-2 text-2xl text-ink">Executive control center</p>
            </div>
            <span className="lp-mono hidden shrink-0 border border-ink bg-ember px-3 py-2 text-white sm:inline-block">
              + Deploy bot
            </span>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-px border-y border-ink/15 bg-ink/15 lg:grid-cols-4">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="lp-mono text-ink-faint">{stat.label}</span>
                    <Icon
                      className={cn('h-3.5 w-3.5', stat.warn ? 'text-ember' : 'text-ink-faint')}
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="lp-display mt-3 text-xl text-ink">{stat.value}</p>
                  <p className="mt-1.5 text-[11px] text-ink-faint">{stat.hint}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-px bg-ink/15 xl:grid-cols-[1.55fr_1fr]">
            {/* Worker table */}
            <div className="bg-white">
              <div className="flex items-center justify-between border-b border-ink/15 px-5 py-3">
                <span className="lp-mono text-ink">Instances</span>
                <span className="lp-mono text-ink-faint">5 of 140 shown</span>
              </div>

              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-ink/15">
                    {['worker', 'server', 'route', 'status', 'uptime', 'shards', ''].map((h) => (
                      <th key={h} className="lp-mono px-3 py-2 text-ink-faint first:pl-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WORKERS.map(([name, server, route, state, uptime, shards]) => (
                    <tr key={name} className="border-b border-ink/10 last:border-b-0">
                      <td className="px-3 py-2.5 pl-5 font-mono text-[11px] text-ink">{name}</td>
                      <td className="px-3 py-2.5 text-[11px] text-ink-soft">{server}</td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-ink-soft">{route}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn('lp-mono border px-1.5 py-0.5', statusTone(state))}>{state}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-ink-soft">{uptime}</td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-ink">{shards}</td>
                      <td className="px-3 py-2.5 pr-4">
                        <span className="flex items-center justify-end gap-1.5">
                          {state === 'stopped' ? (
                            <span className="border border-ink/20 p-1 text-jade">
                              <Play className="h-3 w-3" strokeWidth={1.5} />
                            </span>
                          ) : (
                            <span className="border border-ink/20 p-1 text-ink-soft">
                              <Square className="h-3 w-3" strokeWidth={1.5} />
                            </span>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Event stream + load */}
            <div className="bg-white">
              <div className="flex items-center justify-between border-b border-ink/15 px-5 py-3">
                <span className="lp-mono text-ink">Event stream</span>
                <span className="lp-mono flex items-center gap-1.5 text-ember">
                  <span className="h-1.5 w-1.5 animate-pulse bg-ember" />
                  live
                </span>
              </div>

              <ul className="divide-y divide-ink/10">
                {EVENTS.map(([time, msg, level], i) => (
                  <li key={i} className="flex items-start gap-2.5 px-5 py-2.5">
                    <span className="font-mono text-[10px] text-ink-faint">{time}</span>
                    <span className={cn('mt-1 h-1.5 w-1.5 shrink-0', level === 'warn' ? 'bg-ember' : 'bg-jade')} />
                    <span className="text-[11px] leading-snug text-ink-soft">{msg}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-ink/15 px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="lp-mono text-ink-faint">Control plane load</span>
                  <span className="lp-mono text-ink">41%</span>
                </div>
                <div className="mt-3 flex h-8 items-end gap-px">
                  {[28, 34, 30, 46, 38, 52, 44, 61, 49, 57, 41, 66, 58, 72, 63, 55, 48, 59, 51, 44, 39, 47, 42, 36]
                    .map((h, i) => (
                      <span
                        key={i}
                        className={cn('flex-1', i === 13 ? 'bg-ember' : 'bg-ink/15')}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-ink/15 bg-paper-2 px-5 py-2.5">
            <span className="lp-mono flex items-center gap-2 text-ink-soft">
              <span className="h-1.5 w-1.5 bg-jade" />
              All systems operational
            </span>
            <span className="lp-mono hidden text-ink-faint sm:block">sse connected · 1,200 lines buffered</span>
          </div>
        </div>
      </div>
    </div>
  );
}
