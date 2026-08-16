'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, Bot, Braces, CalendarClock, Command, CreditCard, Gauge,
  LogOut, Menu, Network, PanelLeftClose, PanelLeftOpen, Settings,
  Users, X, Shield, Zap, LayoutGrid, Search
} from 'lucide-react';
import { useAuth } from '@/components/providers';
import { DashboardProvider, useDashboard } from '@/components/dashboard-provider';
import { CommandPalette } from '@/components/command-palette';
import { cn } from '@/lib/api';
import { supabase } from '@/lib/supabase';

// Updated Professional Names
const navItems = [
  // 1. Tenant Workspace
  { href: '/overview', label: 'Dashboard', icon: Gauge, group: 'Workspace' },
  { href: '/bots', label: 'Instances', icon: Bot, group: 'Workspace' },
  { href: '/tiles', label: 'Fleet Grid', icon: LayoutGrid, group: 'Workspace' },
  { href: '/network', label: 'Network', icon: Network, group: 'Workspace' },

  // 2. Automation & Scripting
  { href: '/aliases', label: 'Commands', icon: Command, group: 'Automation' },
  { href: '/scripts', label: 'Routines', icon: Braces, group: 'Automation' },
  { href: '/schedules', label: 'Cron Jobs', icon: CalendarClock, group: 'Automation' },
  { href: '/activity', label: 'Event Logs', icon: Activity, group: 'Automation' },

  // 3. Super Administration (Admin Only)
  { href: '/users', label: 'Access Control', icon: Users, group: 'Administration', admin: true },
  { href: '/plans', label: 'Revenue', icon: CreditCard, group: 'Administration', admin: true },

  // 4. Account & Billing
  { href: '/billing', label: 'Billing', icon: Zap, group: 'Account' },
  { href: '/settings', label: 'Preferences', icon: Settings, group: 'Account' },
];

function DashboardLoadingScreen() {
  return (
    <div className="lp fixed inset-0 z-[100] flex flex-col items-center justify-center bg-paper p-4 select-none">
      <div className="flex flex-col items-center gap-4 w-56 text-center border border-ink bg-white p-6 shadow-[6px_6px_0_#111111]">
        <div className="flex items-center gap-2">
          <span className="lp-display text-2xl font-bold text-ink">Native</span>
          <span className="lp-mono text-ink-faint">/ v4</span>
        </div>
        <span className="lp-mono text-[11px] text-ink-soft">
          Loading Console...
        </span>
        <div className="h-1.5 w-full bg-paper-2 border border-ink/30 overflow-hidden relative">
          <div className="h-full bg-ember w-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return <DashboardLoadingScreen />;
  }

  return (
    <DashboardProvider>
      <ShellFrame>{children}</ShellFrame>
    </DashboardProvider>
  );
}

function ShellFrame({ children }) {
  const { user, logout } = useAuth();
  const { bots, proxies } = useDashboard();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(user?.preferences?.sidebar === 'collapsed');

  useEffect(() => setMobileOpen(false), [pathname]);

  const handleLogout = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch (e) { /* ignore */ }
    await logout();
    router.replace('/login');
    router.refresh();
  }, [logout, router]);

  const isAdmin = user?.role === 'admin';
  const userTier = user?.preferences?.tier || 'free';
  const customLimits = user?.preferences?.customLimits;

  const tierBadgeLabel = useMemo(() => {
    if (isAdmin) return 'SUPER ADMIN';
    if (userTier === 'custom') return `CUSTOM (${customLimits?.maxBots || 1} BOTS)`;
    if (userTier === 'unlimited_15') return 'PRO TIER';
    if (userTier === 'silver_5') return 'SILVER (10 BOTS)';
    if (userTier === 'bronze_3') return 'BRONZE (3 BOTS)';
    return 'STARTER TIER';
  }, [isAdmin, userTier, customLimits]);

  const visibleItems = useMemo(
    () => navItems.filter((item) => !item.admin || isAdmin),
    [isAdmin]
  );

  const groups = useMemo(
    () => Array.from(new Set(visibleItems.map((item) => item.group))),
    [visibleItems]
  );

  const paletteItems = useMemo(
    () => [
      ...visibleItems.map((item) => ({
        id: item.href,
        label: item.label,
        category: item.group,
        icon: item.icon,
        action: () => router.push(item.href),
      })),
      {
        id: 'new-bot',
        label: 'Deploy New Instance',
        category: 'Actions',
        icon: Bot,
        action: () => router.push('/bots?action=new'),
      },
      {
        id: 'upgrade-plan',
        label: 'Upgrade Subscription',
        category: 'Billing',
        icon: Zap,
        action: () => router.push('/billing'),
      },
    ],
    [visibleItems, router]
  );

  const runningBotsCount = bots.filter((b) => b.status === 'running').length;

  const currentNav = visibleItems.find((item) => pathname.startsWith(item.href));

  return (
    <div className="lp relative flex min-h-screen bg-paper text-ink selection:bg-ember selection:text-white">
      <div className="lp-noise" aria-hidden="true" />
      <CommandPalette items={paletteItems} />

      {/* ── Left Sidebar (Desktop) ─────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-rule bg-paper-2 transition-all duration-200 ease-out md:flex',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Top Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-rule px-5">
          <Link href="/overview" className="flex items-center gap-2.5 overflow-hidden group">
            <span className="lp-display text-2xl font-bold tracking-tight text-ink">Native</span>
            <span className="lp-mono text-[10px] text-ink-faint">/ v4</span>
          </Link>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 text-ink-soft hover:text-ink transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Tenant Scope / Role Pill */}
        {!collapsed && (
          <div className="mx-4 my-4 border border-ink bg-white p-3.5 shadow-[3px_3px_0_#111111]">
            <div className="flex items-center justify-between">
              <span className="lp-mono text-[10px] text-ink-faint">WORKSPACE</span>
              <span className={cn(
                'border px-1.5 py-0.5 lp-mono text-[9px] font-bold uppercase',
                isAdmin
                  ? 'border-ember bg-ember/10 text-ember'
                  : userTier !== 'free'
                  ? 'border-ink bg-paper text-ink'
                  : 'border-rule bg-paper-2 text-ink-soft'
              )}>
                {tierBadgeLabel}
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] text-ink-soft">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-jade animate-pulse" />
                <strong className="text-ink">{runningBotsCount}</strong> active
              </span>
              <span className="text-ink-faint">{proxies.length} nodes</span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
          {groups.map((group) => (
            <div key={group} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-2 pt-1 lp-mono text-[10px] text-ink-faint flex items-center justify-between">
                  <span>{group}</span>
                  {group === 'Administration' && (
                    <Shield className="h-3 w-3 text-ember" strokeWidth={1.5} />
                  )}
                </div>
              )}
              {visibleItems
                .filter((item) => item.group === group)
                .map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'group flex items-center gap-3 px-3 py-2.5 text-[13px] font-mono transition-all duration-150',
                        active
                          ? 'border border-ink bg-white text-ink shadow-[2px_2px_0_#111111] font-bold'
                          : 'border border-transparent text-ink-soft hover:bg-white/80 hover:text-ink hover:border-ink/20',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0 transition-transform duration-150', active ? 'text-ember' : 'text-ink-soft group-hover:text-ink')} strokeWidth={1.5} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
            </div>
          ))}
        </div>

        {/* Collapsed Expand Trigger */}
        {collapsed && (
          <div className="p-3 border-t border-rule flex justify-center">
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 text-ink-soft hover:text-ink transition cursor-pointer"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* Bottom User Card */}
        <div className="shrink-0 border-t border-rule p-4 bg-paper-2">
          <div className={cn('flex items-center gap-3', collapsed ? 'justify-center' : 'justify-between')}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-ink bg-white font-mono text-xs font-bold text-ink uppercase shadow-[1px_1px_0_#111111]">
                {user?.email ? user.email.slice(0, 2) : 'US'}
              </span>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-mono font-bold text-ink">
                    {user?.email}
                  </span>
                  <span className="block truncate lp-mono text-[9px] text-ink-faint">
                    {user?.role === 'admin' ? 'Super Administrator' : 'Operator Member'}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="border border-ink/20 bg-white p-1.5 text-ink-soft hover:border-ember hover:bg-ember/10 hover:text-ember transition cursor-pointer shadow-sm"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main App Content ────────────────────────────────────────── */}
      <div className={cn('flex flex-1 flex-col transition-all duration-200 min-w-0', collapsed ? 'md:pl-20' : 'md:pl-64')}>
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-rule bg-paper/90 px-5 sm:px-8 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="border border-ink bg-white p-2 text-ink shadow-[2px_2px_0_#111111] md:hidden cursor-pointer"
            >
              <Menu className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <div className="flex items-center gap-2">
              <span className="lp-display text-lg font-bold text-ink">
                {currentNav ? currentNav.label : 'Control Plane'}
              </span>
              <span className="hidden sm:inline lp-mono text-ink-faint text-[11px]">
                // {currentNav ? currentNav.group : 'System'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Status Pill */}
            <div className="hidden sm:flex items-center gap-3 border border-ink/20 bg-white px-3 py-1.5 shadow-[2px_2px_0_rgba(17,17,17,0.05)]">
              <span className="flex items-center gap-1.5 lp-mono text-[10px] text-ink">
                <span className="h-1.5 w-1.5 bg-jade animate-pulse" />
                {runningBotsCount} BOTS LIVE
              </span>
              <span className="h-3 w-px bg-rule" />
              <span className="lp-mono text-[10px] text-ink-soft">
                {proxies.length} PROXIES
              </span>
            </div>

            {/* Command Palette Trigger */}
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-2 border border-ink bg-white px-3 py-1.5 lp-mono text-[11px] text-ink shadow-[2px_2px_0_#111111] hover:bg-paper-2 transition cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 text-ember" strokeWidth={1.5} />
              <span className="hidden md:inline">Command Menu</span>
              <span className="border border-ink/20 bg-paper-2 px-1 py-0.2 text-[10px] text-ink-soft">⌘K</span>
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-paper border-r border-ink p-5 shadow-[8px_0_0_#111111]">
              <div className="flex items-center justify-between pb-4 border-b border-rule">
                <div className="flex items-center gap-2">
                  <span className="lp-display text-2xl font-bold text-ink">Native</span>
                  <span className="lp-mono text-ink-faint">/ v4</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="border border-ink bg-white p-1 text-ink">
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-6">
                {groups.map((group) => (
                  <div key={group} className="space-y-1">
                    <span className="px-2 lp-mono text-[10px] text-ink-faint uppercase">{group}</span>
                    {visibleItems
                      .filter((item) => item.group === group)
                      .map((item) => {
                        const Icon = item.icon;
                        const active = pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 font-mono text-xs transition-all',
                              active
                                ? 'border border-ink bg-white text-ink font-bold shadow-[2px_2px_0_#111111]'
                                : 'text-ink-soft hover:bg-white/70'
                            )}
                          >
                            <Icon className={cn("h-4 w-4", active ? "text-ember" : "text-ink-soft")} strokeWidth={1.5} />
                            {item.label}
                          </Link>
                        );
                      })}
                  </div>
                ))}
              </div>

              <div className="border-t border-rule pt-4 flex items-center justify-between">
                <span className="text-xs font-mono font-bold truncate text-ink">{user?.email}</span>
                <button onClick={handleLogout} className="border border-ink bg-white p-1.5 text-ink hover:text-ember">
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Primary Page Canvas */}
        <main className="flex-1 p-5 sm:p-8 lg:p-10 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
