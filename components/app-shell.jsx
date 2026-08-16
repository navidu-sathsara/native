'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, Bot, Braces, CalendarClock, Command, CreditCard, Gauge,
  LogOut, Menu, Network, PanelLeftClose, PanelLeftOpen, Settings,
  Users, X, Shield, Zap, LayoutGrid
} from 'lucide-react';
import { useAuth } from '@/components/providers';
import { DashboardProvider, useDashboard } from '@/components/dashboard-provider';
import { CommandPalette } from '@/components/command-palette';
import { cn } from '@/lib/api';
import { NoraLogo } from '@/components/nora-logo';
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
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white p-4 select-none">
      <div className="flex flex-col items-center gap-3 w-48 text-center">
        <span className="text-xs font-semibold tracking-wider text-brand-500 uppercase">
          Loading Workspace
        </span>
        <div className="h-1 w-full bg-brand-100 rounded-full overflow-hidden relative">
          <div className="h-full bg-blurple-500 rounded-full w-full animate-pulse" />
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

  return (
    <div className="relative flex min-h-screen bg-brand-50 text-brand-900 selection:bg-blurple-100 selection:text-blurple-900">
      <CommandPalette items={paletteItems} />

      {/* ── Left Sidebar (Desktop) ─────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-brand-200 bg-white transition-all duration-300 ease-out md:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)]',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Top Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-brand-100 px-4">
          <Link href="/overview" className="flex items-center gap-3 overflow-hidden group">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-white p-1.5 text-brand-900 transition duration-300 shadow-sm group-hover:shadow-md">
              <NoraLogo className="h-full w-full text-brand-900" />
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-brand-900 text-sm">Native</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-sm" />
                </div>
                <span className="block truncate text-[10px] uppercase tracking-widest text-brand-500 font-bold">
                  Cloud Console
                </span>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="rounded-lg p-1.5 text-brand-400 hover:bg-brand-50 hover:text-brand-900 transition"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tenant Scope / Role Pill */}
        {!collapsed && (
          <div className="mx-4 my-4 rounded-xl border border-brand-100 bg-brand-50 p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-500">Workspace</span>
              <span className={cn(
                'rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                isAdmin
                  ? 'bg-purple-100 text-purple-700'
                  : userTier !== 'free'
                  ? 'bg-blurple-100 text-blurple-700'
                  : 'bg-white border border-brand-200 text-brand-600'
              )}>
                {tierBadgeLabel}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-medium text-brand-700">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {runningBotsCount} active
              </span>
              <span className="text-brand-500">{proxies.length} nodes</span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
          {groups.map((group) => (
            <div key={group} className="space-y-1">
              {!collapsed && (
                <div className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-brand-400 flex items-center justify-between">
                  <span>{group}</span>
                  {group === 'Administration' && (
                    <Shield className="h-3 w-3 text-purple-500" />
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
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                        active
                          ? 'bg-brand-50 text-blurple-600 font-semibold'
                          : 'text-brand-600 font-medium hover:bg-brand-50 hover:text-brand-900',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0 transition-transform duration-200', active ? 'text-blurple-600' : 'text-brand-400 group-hover:text-brand-600')} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
            </div>
          ))}
        </div>

        {/* Collapsed Expand Trigger */}
        {collapsed && (
          <div className="p-2 border-t border-brand-100 flex justify-center">
            <button
              onClick={() => setCollapsed(false)}
              className="rounded-lg p-2 text-brand-400 hover:bg-brand-50 hover:text-brand-900 transition"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Bottom User Card */}
        <div className="shrink-0 border-t border-brand-100 p-4 bg-white">
          <div className={cn('flex items-center gap-3', collapsed ? 'justify-center' : 'justify-between')}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-xs font-bold text-brand-700 uppercase shadow-sm">
                {user?.email ? user.email.slice(0, 2) : 'US'}
              </span>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-brand-900">
                    {user?.email}
                  </span>
                  <span className="block truncate text-xs text-brand-500">
                    {user?.role === 'admin' ? 'Super Admin' : 'Member'}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="rounded-md p-1.5 text-brand-400 hover:bg-red-50 hover:text-red-600 transition"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main App Content ────────────────────────────────────────── */}
      <div className={cn('flex flex-1 flex-col transition-all duration-300 min-w-0', collapsed ? 'md:pl-20' : 'md:pl-64')}>
        
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-brand-200 bg-white/90 px-4 backdrop-blur-xl md:hidden shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-200 bg-white p-1.5 shadow-sm">
              <NoraLogo className="h-full w-full text-brand-900" />
            </span>
            <span className="font-bold tracking-tight text-brand-900 text-sm">Native</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-brand-200 bg-white p-2 text-brand-600 shadow-sm"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-brand-900/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-white border-r border-brand-200 p-4 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-brand-100">
                <div className="flex items-center gap-2">
                  <NoraLogo className="h-6 w-6 text-brand-900" />
                  <span className="font-bold text-brand-900">Native</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-brand-400 hover:bg-brand-50">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-6">
                {groups.map((group) => (
                  <div key={group} className="space-y-1">
                    <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-brand-400">{group}</span>
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
                              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                              active ? 'bg-brand-50 text-blurple-600 font-bold' : 'text-brand-600 hover:bg-brand-50'
                            )}
                          >
                            <Icon className={cn("h-4 w-4", active ? "text-blurple-600" : "text-brand-400")} />
                            {item.label}
                          </Link>
                        );
                      })}
                  </div>
                ))}
              </div>

              <div className="border-t border-brand-100 pt-4 flex items-center justify-between">
                <span className="text-sm font-semibold truncate text-brand-900">{user?.email}</span>
                <button onClick={handleLogout} className="p-2 text-brand-400 hover:bg-red-50 hover:text-red-600 rounded-md">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Primary Page Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
