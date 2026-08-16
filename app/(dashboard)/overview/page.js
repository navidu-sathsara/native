'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Activity, ArrowUpRight, Bot, Boxes, CircleStop, Cpu, Network, Play,
  Send, ShieldCheck, Sparkles, Tag, Users, Zap, Clock, CheckCircle2,
  Lock, ArrowRight, Layers, Tags, Plus, RefreshCw, Terminal, Check,
  AlertTriangle, Shield, Globe, Power, DollarSign, TrendingUp,
  Server, Database, HardDrive, Key, LayoutGrid, CheckSquare
} from 'lucide-react';
import { useDashboard } from '@/components/dashboard-provider';
import { useAuth, useToast } from '@/components/providers';
import { Button, EmptyState, PageHeader, Panel, StatCard, StatusBadge, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { botLabel, categoryOf, formatDate, relativeTime } from '@/lib/format';

const PRESET_TIER_NAMES = {
  free: 'Free Starter ($0)',
  bronze_3: 'Bronze Pro ($2)',
  silver_5: 'Silver Pro ($5)',
  unlimited_15: 'Unlimited Pro ($12)',
  custom: 'Custom Fleet Plan',
};

export default function OverviewPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    return <AdminOverviewPage />;
  }

  return <TenantOverviewPage />;
}

/**
 * 👑 LUXURY SUPER ADMIN OVERVIEW PAGE
 * Complete platform health, revenue metrics, server node stats, and global fleet control.
 */
function AdminOverviewPage() {
  const { bots, proxies, refreshBots, refreshProxies, loading } = useDashboard();
  const { user } = useAuth();
  const { toast } = useToast();

  const [adminData, setAdminData] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [checkingProxies, setCheckingProxies] = useState(false);
  const [busyBot, setBusyBot] = useState('');
  const [globalCmd, setGlobalCmd] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // Fetch admin plans metrics and server telemetry
  const fetchAdminTelemetry = useCallback(async () => {
    setAdminLoading(true);
    try {
      const res = await api('/admin/plans');
      setAdminData(res);
    } catch (err) {
      toast(err.message || 'Failed to load platform metrics', 'error');
    } finally {
      setAdminLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAdminTelemetry();
  }, [fetchAdminTelemetry]);

  // Test all proxies across the platform
  const handleCheckAllProxies = async () => {
    setCheckingProxies(true);
    try {
      const res = await api('/proxies/check-all', { method: 'POST', body: '{}' });
      await refreshProxies();
      await fetchAdminTelemetry();
      toast(`Probe complete: ${res.working || 0} online · ${res.failed || 0} offline`, res.failed ? 'warning' : 'success');
    } catch (err) {
      toast(err.message || 'Proxy probe failed', 'error');
    } finally {
      setCheckingProxies(false);
    }
  };

  // Single bot lifecycle
  const handleLifecycle = async (bot, action) => {
    setBusyBot(`${bot.id}:${action}`);
    try {
      await api(`/bots/${encodeURIComponent(bot.id)}/${action}`, { method: 'POST' });
      toast(`${botLabel(bot)} ${action === 'start' ? 'started' : 'stopped'}`, 'success');
      setTimeout(refreshBots, action === 'start' ? 500 : 1500);
      setTimeout(fetchAdminTelemetry, 1000);
    } catch (err) {
      toast(err.message || 'Action failed', 'error');
    } finally {
      setBusyBot('');
    }
  };

  // Mass command broadcast
  const handleBroadcast = async (cmdText) => {
    const value = (cmdText || globalCmd).trim();
    if (!value) return;
    setBroadcasting(true);
    try {
      const res = await api('/mass-cmd', { method: 'POST', body: JSON.stringify({ cmd: value }) });
      toast(`Command broadcasted to ${res.total || 0} active worker(s)`, 'success');
      setGlobalCmd('');
    } catch (err) {
      toast(err.message || 'Broadcast failed', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  const metrics = adminData?.metrics || {
    totalUsers: 0,
    activePaidUsers: 0,
    totalMRR: 0,
    totalBotsProvisioned: 0,
    totalProxiesAllocated: 0,
    tierDistribution: {},
    serverInfo: {}
  };

  const serverInfo = metrics.serverInfo || {};
  const runningBotsCount = bots.filter((b) => b.status === 'running').length;
  const errorBotsCount = bots.filter((b) => b.status === 'error').length;
  const healthyProxiesCount = proxies.filter((p) => p.alive).length;
  const freeProxiesCount = proxies.filter((p) => p.isFree).length;
  const totalFleetShards = bots.reduce((sum, b) => sum + (typeof b.shards === 'number' ? b.shards : 0), 0);

  const uptimeStr = useMemo(() => {
    const s = serverInfo.uptimeSec || 0;
    const days = Math.floor(s / 86400);
    const hrs = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    if (days > 0) return `${days}d ${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${s % 60}s`;
  }, [serverInfo.uptimeSec]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        eyebrow="Platform Command HQ · Super Administrator"
        title="Executive Control Center"
        description="Global platform telemetry, Monthly Recurring Revenue (MRR), server node infrastructure, and tenant fleets."
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              loading={checkingProxies}
              onClick={handleCheckAllProxies}
              className="text-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Test All Proxies
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={adminLoading}
              onClick={() => { fetchAdminTelemetry(); refreshBots(); refreshProxies(); }}
              className="text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh HQ
            </Button>
            <Link href="/bots?action=new">
              <Button size="sm" variant="primary">
                + Deploy Bot
              </Button>
            </Link>
          </div>
        }
      />

      {/* 👑 Super Admin Hero Banner */}
      <Panel className="p-6 border-purple-500/20 bg-gradient-to-r from-brand-100 via-brand-50 to-white shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3.5 text-purple-300 shadow-inner">
                <Shield className="h-7 w-7" />
              </span>
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#0b0b0b] bg-emerald-400 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-brand-900 tracking-tight">Super Administrator HQ</h2>
                <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                  Global Access Plane
                </span>
              </div>
              <p className="text-xs text-brand-500 mt-1 flex flex-wrap items-center gap-3">
                <span>Platform MRR: <strong className="text-emerald-400 font-bold font-mono">${metrics.totalMRR.toFixed(2)}</strong></span>
                <span>•</span>
                <span>Active Fleets: <strong className="text-brand-900">{runningBotsCount}</strong> / {bots.length} Running</span>
                <span>•</span>
                <span>Subscribers: <strong className="text-brand-900">{metrics.totalUsers}</strong> Accounts</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/plans">
              <Button size="sm" variant="secondary" className="text-xs">
                <DollarSign className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                Plans & MRR
              </Button>
            </Link>
            <Link href="/users">
              <Button size="sm" variant="secondary" className="text-xs">
                <Users className="h-3.5 w-3.5 mr-1 text-blue-400" />
                Users & Quotas
              </Button>
            </Link>
            <Link href="/tiles">
              <Button size="sm" variant="primary" className="text-xs font-semibold shadow-lg">
                <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                Multi-Console Matrix
              </Button>
            </Link>
          </div>
        </div>
      </Panel>

      {/* 4 Core Pillar StatCards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Platform MRR"
          value={`$${metrics.totalMRR.toFixed(2)}`}
          hint={`${metrics.activePaidUsers} paid / ${metrics.totalUsers} total users (${metrics.totalUsers ? Math.round((metrics.activePaidUsers / metrics.totalUsers) * 100) : 0}% conv)`}
          icon={TrendingUp}
          tone="green"
          highlight={true}
        />
        <StatCard
          label="Global Bots"
          value={`${runningBotsCount} / ${bots.length}`}
          hint={`${bots.length - runningBotsCount} stopped · ${errorBotsCount} errors`}
          icon={Bot}
          tone="blue"
        />
        <StatCard
          label="Proxy Infrastructure"
          value={`${healthyProxiesCount} / ${proxies.length}`}
          hint={`${freeProxiesCount} free pool · ${proxies.length - freeProxiesCount} dedicated`}
          icon={Network}
          tone={healthyProxiesCount === proxies.length && proxies.length > 0 ? 'green' : 'amber'}
        />
        <StatCard
          label="Fleet Shards Mined"
          value={`✦ ${totalFleetShards.toLocaleString()}`}
          hint="Total currency balance"
          icon={Sparkles}
          tone="amber"
        />
      </div>

      {/* 🖥️ Server Node & Runtime Infrastructure Telemetry */}
      <Panel className="p-6 border-brand-200 bg-brand-50 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-brand-200">
          <div className="flex items-center gap-2.5">
            <Server className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-brand-900">Server Node & Process Telemetry</h3>
          </div>
          <span className="font-mono text-[10px] text-brand-500 bg-white border border-brand-200 px-2 py-0.5 rounded">
            Node.js {serverInfo.nodeVersion || process.version}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-brand-200 bg-white p-3.5">
            <span className="block text-[10px] uppercase font-semibold text-brand-500">Server Uptime</span>
            <span className="text-base font-bold text-brand-900 mt-1 block font-mono">
              {uptimeStr}
            </span>
            <span className="text-[10px] text-emerald-400/90 font-mono">Zero crash recovery</span>
          </div>

          <div className="rounded-xl border border-brand-200 bg-white p-3.5">
            <span className="block text-[10px] uppercase font-semibold text-brand-500">Memory (Heap Used)</span>
            <span className="text-base font-bold text-brand-900 mt-1 block font-mono">
              {serverInfo.memoryUsageMB || 60} MB / {serverInfo.totalMemoryMB || 85} MB
            </span>
            <span className="text-[10px] text-brand-500 font-mono">RSS: {serverInfo.rssMB || 95} MB</span>
          </div>

          <div className="rounded-xl border border-brand-200 bg-white p-3.5">
            <span className="block text-[10px] uppercase font-semibold text-brand-500">Child Bot Processes</span>
            <span className="text-base font-bold text-brand-900 mt-1 block font-mono">
              {runningBotsCount} Spawned
            </span>
            <span className="text-[10px] text-brand-500 font-mono">{bots.length} total managed</span>
          </div>

          <div className="rounded-xl border border-brand-200 bg-white p-3.5">
            <span className="block text-[10px] uppercase font-semibold text-brand-500">Active Tenants</span>
            <span className="text-base font-bold text-brand-900 mt-1 block font-mono">
              {metrics.totalUsers} Registered
            </span>
            <span className="text-[10px] text-purple-300 font-mono">{metrics.activePaidUsers} Paid SaaS Tiers</span>
          </div>
        </div>
      </Panel>

      {/* 📊 SaaS Tiers & Subscriber Breakdown */}
      <Panel className="p-6 border-brand-200 bg-brand-50 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-brand-200">
          <div>
            <h3 className="text-sm font-bold text-brand-900">SaaS Subscription Tiers Distribution</h3>
            <p className="text-xs text-brand-500 mt-0.5">Active subscriber distribution across plans</p>
          </div>
          <Link href="/plans">
            <Button size="sm" variant="ghost" className="text-xs text-brand-500 hover:text-brand-900">
              Manage Tiers <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-xl border border-brand-200 bg-white p-3.5">
            <span className="block text-[10px] uppercase font-semibold text-brand-500">Free Starter ($0)</span>
            <span className="text-xl font-bold text-brand-900 mt-1 block">{metrics.tierDistribution?.free || 0}</span>
            <span className="text-[10px] text-brand-500">1 bot limit</span>
          </div>

          <div className="rounded-xl border border-brand-200 bg-white p-3.5">
            <span className="block text-[10px] uppercase font-semibold text-brand-500">Bronze Pro ($2)</span>
            <span className="text-xl font-bold text-brand-900 mt-1 block">{metrics.tierDistribution?.bronze_3 || 0}</span>
            <span className="text-[10px] text-brand-500">3 bots limit</span>
          </div>

          <div className="rounded-xl border border-brand-200 bg-white p-3.5">
            <span className="block text-[10px] uppercase font-semibold text-brand-500">Silver Pro ($5)</span>
            <span className="text-xl font-bold text-brand-900 mt-1 block">{metrics.tierDistribution?.silver_5 || 0}</span>
            <span className="text-[10px] text-brand-500">10 bots limit</span>
          </div>

          <div className="rounded-xl border border-brand-200 bg-white p-3.5">
            <span className="block text-[10px] uppercase font-semibold text-brand-500">Unlimited Pro ($12)</span>
            <span className="text-xl font-bold text-brand-900 mt-1 block">{metrics.tierDistribution?.unlimited_15 || 0}</span>
            <span className="text-[10px] text-brand-500">∞ bots limit</span>
          </div>

          <div className="rounded-xl border border-brand-200 bg-white p-3.5">
            <span className="block text-[10px] uppercase font-semibold text-brand-500">Custom Fleets</span>
            <span className="text-xl font-bold text-brand-900 mt-1 block text-emerald-400">{metrics.tierDistribution?.custom || 0}</span>
            <span className="text-[10px] text-brand-500">$0.50/bot + $0.50/proxy</span>
          </div>
        </div>
      </Panel>

      {/* 🚀 Main Global Fleet Grid & Global Terminal Deck */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: All Managed Bots (8 Cols) */}
        <Panel className="p-6 lg:col-span-8 border-brand-200 bg-brand-50 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-brand-200">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-brand-500" />
              <h3 className="text-base font-bold text-brand-900">Global Managed Fleets Roster</h3>
            </div>
            <Link href="/bots">
              <Button size="sm" variant="ghost" className="text-xs text-brand-500 hover:text-brand-900">
                View All <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Panel key={i} className="p-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                </Panel>
              ))}
            </div>
          ) : bots.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {bots.slice(0, 10).map((bot) => {
                const isRunning = bot.status === 'running';
                const shardVal = typeof bot.shards === 'number' ? bot.shards : null;

                return (
                  <div
                    key={bot.id}
                    className="rounded-xl border border-brand-200 bg-white p-3.5 flex flex-col justify-between space-y-3 hover:border-brand-200 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/bots?bot=${encodeURIComponent(bot.id)}`}
                          className="block truncate text-xs font-bold text-brand-900 hover:underline"
                        >
                          {botLabel(bot)}
                        </Link>
                        <span className="block font-mono text-[9px] text-brand-500 truncate mt-0.5">
                          {bot.config?.host || 'No server'}:{bot.config?.port || '25565'}
                        </span>
                      </div>
                      <StatusBadge status={bot.status} />
                    </div>

                    <div className="flex items-center justify-between border-t border-brand-200 pt-2 text-[10px]">
                      <span className="font-mono text-amber-400 font-bold">
                        {shardVal !== null ? `✦ ${shardVal.toLocaleString()}` : '-- shards'}
                      </span>

                      {isRunning ? (
                        <button
                          onClick={() => handleLifecycle(bot, 'stop')}
                          disabled={busyBot === `${bot.id}:stop`}
                          className="rounded bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-red-300 hover:bg-red-500/30 transition flex items-center gap-1 font-semibold"
                        >
                          <CircleStop className="h-3 w-3" /> Stop
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLifecycle(bot, 'start')}
                          disabled={busyBot === `${bot.id}:start`}
                          className="rounded bg-brand-50 border border-brand-200 px-2 py-0.5 text-brand-900 hover:bg-brand-50 transition flex items-center gap-1 font-semibold"
                        >
                          <Play className="h-3 w-3" /> Start
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Bot}
              title="No bots deployed"
              description="Deploy autonomous bot instances to manage them here."
              action={
                <Link href="/bots?action=new">
                  <Button variant="primary">+ Deploy First Bot</Button>
                </Link>
              }
            />
          )}
        </Panel>

        {/* Right Column: Global Broadcaster & Quick Links (4 Cols) */}
        <div className="space-y-6 lg:col-span-4">
          <Panel className="p-6 border-brand-200 bg-brand-50 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-brand-200">
              <Terminal className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-bold text-brand-900">Global Command Broadcaster</h3>
            </div>

            <p className="text-xs text-brand-500">
              Broadcast commands to all {runningBotsCount} currently running bots instantly.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleBroadcast();
              }}
              className="space-y-2"
            >
              <input
                type="text"
                value={globalCmd}
                onChange={(e) => setGlobalCmd(e.target.value)}
                placeholder="e.g. !say Server restarting in 5m, !sell, !drop"
                className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-mono text-brand-900 placeholder-brand-400 focus:border-brand-200 focus:outline-none"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full font-semibold"
                loading={broadcasting}
                disabled={!globalCmd.trim()}
              >
                <Send className="h-3.5 w-3.5 mr-1" /> Broadcast to All Bots
              </Button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-brand-200">
              {['!status', '!ping', '!shard', '!mine', '!sell', '!drop'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleBroadcast(m)}
                  className="rounded border border-brand-200 bg-brand-50 px-2 py-0.5 font-mono text-[9px] text-brand-500 hover:border-brand-200 hover:text-brand-900 transition"
                >
                  {m}
                </button>
              ))}
            </div>
          </Panel>

          {/* Quick Hub Navigation Cards */}
          <Panel className="p-5 border-brand-200 bg-brand-50 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500 block">Admin Command Hubs</span>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/network"
                className="p-3 rounded-xl border border-brand-200 bg-brand-50 hover:bg-brand-50 transition space-y-1 block"
              >
                <Network className="h-4 w-4 text-emerald-400" />
                <span className="block text-xs font-bold text-brand-900">Proxy Pool</span>
                <span className="block text-[10px] text-brand-500">{proxies.length} endpoints</span>
              </Link>
              <Link
                href="/tiles"
                className="p-3 rounded-xl border border-brand-200 bg-brand-50 hover:bg-brand-50 transition space-y-1 block"
              >
                <LayoutGrid className="h-4 w-4 text-purple-400" />
                <span className="block text-xs font-bold text-brand-900">Fleet Matrix</span>
                <span className="block text-[10px] text-brand-500">Multi-Console</span>
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/**
 * 👤 STANDARD TENANT OVERVIEW PAGE
 * For regular / paid users with capacity meters, quick controls, and bot fleet cards.
 */
function TenantOverviewPage() {
  const { bots, proxies, loading, refreshBots, refreshProxies } = useDashboard();
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [command, setCommand] = useState('');
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState('');

  const userTier = user?.preferences?.tier || 'free';
  const customLimits = user?.preferences?.customLimits;

  const maxAllowedBots = useMemo(() => {
    if (user?.role === 'admin') return 9999;
    if (userTier === 'custom') return customLimits?.maxBots || 1;
    if (userTier === 'unlimited_15') return 9999;
    if (userTier === 'silver_5') return 10;
    if (userTier === 'bronze_3') return 3;
    return 1;
  }, [user, userTier, customLimits]);

  useEffect(() => {
    api('/jobs').then((result) => setJobs(result.jobs || [])).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const running = bots.filter((bot) => bot.status === 'running').length;
    const errors = bots.filter((bot) => bot.status === 'error').length;
    const usedSlots = proxies.reduce((total, proxy) => total + (proxy.assignedTo?.length || 0) + (proxy.hiddenAssignments || 0), 0);
    const healthyProxies = proxies.filter((proxy) => proxy.alive).length;
    return {
      running,
      stopped: bots.length - running - errors,
      errors,
      categories: new Set(bots.map(categoryOf)).size,
      healthyProxies,
      totalProxies: proxies.length,
      usedSlots,
    };
  }, [bots, proxies]);

  const lifecycle = async (bot, action) => {
    setBusy(`${bot.id}:${action}`);
    try {
      await api(`/bots/${encodeURIComponent(bot.id)}/${action}`, { method: 'POST' });
      toast(`${botLabel(bot)} ${action === 'start' ? 'started' : 'stopped'}`, 'success');
      window.setTimeout(refreshBots, action === 'start' ? 500 : 1800);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy('');
    }
  };

  const broadcast = async (cmdText) => {
    const value = (cmdText || command).trim();
    if (!value) return;
    setSending(true);
    try {
      const result = await api('/mass-cmd', { method: 'POST', body: JSON.stringify({ cmd: value }) });
      toast(`Command broadcasted to ${result.total} active bot(s)`, 'success');
      setCommand('');
      const data = await api('/jobs');
      setJobs(data.jobs || []);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const isAtLimit = stats.running >= maxAllowedBots;
  const planDisplayName = userTier === 'custom'
    ? `Custom (${customLimits?.maxBots || 1} Bots, ${customLimits?.maxProxies || 0} Proxies)`
    : PRESET_TIER_NAMES[userTier] || 'Free Starter';

  const totalShards = bots.reduce((sum, b) => sum + (typeof b.shards === 'number' ? b.shards : 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        eyebrow="Fleet Command Center"
        title="Overview"
        description="Unified management plane for autonomous Minecraft bots, dedicated proxies, and background scripts."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => { refreshBots(); refreshProxies(); }} loading={loading}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Link href="/bots?action=new">
              <Button size="sm" variant="primary">
                + Deploy Bot
              </Button>
            </Link>
          </div>
        }
      />

      {/* Hero Plan & Capacity Status */}
      <Panel className="p-6 border-brand-200 bg-brand-50 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 p-3 text-brand-900 shadow-inner">
                <Cpu className="h-6 w-6" />
              </span>
              <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#0b0b0b] ${stats.running > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-brand-50'}`} />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-brand-900 tracking-tight">{planDisplayName}</h2>
                <span className="rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[10px] font-bold text-brand-500">
                  {user?.role === 'admin' ? 'Super Admin' : 'Active Subscription'}
                </span>
              </div>
              <p className="text-xs text-brand-500 mt-1 flex items-center gap-2">
                <span>
                  Worker Capacity: <strong className="text-brand-900">{stats.running}</strong> / <strong className="text-brand-900">{maxAllowedBots === 9999 ? 'Unlimited (∞)' : maxAllowedBots}</strong> Running
                </span>
                <span>•</span>
                <span>Proxies: <strong className="text-brand-900">{stats.healthyProxies}</strong> Healthy</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userTier === 'free' ? (
              <Link href="/billing">
                <Button size="sm" variant="primary" className="shadow-lg font-semibold">
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Upgrade to Custom Fleet ($0.50/bot)
                </Button>
              </Link>
            ) : isAtLimit ? (
              <Link href="/billing">
                <Button size="sm" variant="secondary">
                  Scale Fleet Capacity <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            ) : (
              <Link href="/network">
                <Button size="sm" variant="secondary">
                  <Network className="h-3.5 w-3.5 mr-1" />
                  Proxy Infrastructure
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Dynamic Capacity Meter */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-brand-500">
            <span>Fleet Allocation</span>
            <span>{maxAllowedBots === 9999 ? 'Unlimited Tier' : `${Math.round((stats.running / maxAllowedBots) * 100)}% utilized`}</span>
          </div>
          <div className="w-full bg-brand-50 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAtLimit ? 'bg-amber-400 shadow-sm' : 'bg-white'
              }`}
              style={{
                width: maxAllowedBots === 9999 ? '25%' : `${Math.min(100, Math.max(4, (stats.running / maxAllowedBots) * 100))}%`,
              }}
            />
          </div>
        </div>
      </Panel>

      {/* KPI Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Panel key={i} className="p-5 flex justify-between items-start min-h-32">
              <div className="space-y-3 w-full">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-9" />
            </Panel>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
          <StatCard
            label="Running Bots"
            value={stats.running}
            hint={maxAllowedBots === 9999 ? 'Unlimited quota' : `Max ${maxAllowedBots} concurrent`}
            icon={Play}
            tone={isAtLimit ? 'amber' : 'green'}
            highlight={stats.running > 0}
          />
          <StatCard
            label="Total Bots"
            value={bots.length}
            hint="Configured workers"
            icon={Bot}
          />
          <StatCard
            label="Stopped Bots"
            value={stats.stopped}
            hint="Standby instances"
            icon={CircleStop}
          />
          <StatCard
            label="Proxy Health"
            value={`${stats.healthyProxies}/${stats.totalProxies}`}
            hint={`${stats.usedSlots} assigned slots`}
            icon={ShieldCheck}
            tone="blue"
          />
          <StatCard
            label="Fleet Shards"
            value={`✦ ${totalShards.toLocaleString()}`}
            hint="Total mined balance"
            icon={Sparkles}
            tone="amber"
          />
          <StatCard
            label="Fleet Issues"
            value={stats.errors}
            hint={stats.errors ? 'Require attention' : '0 errors logged'}
            icon={Activity}
            tone={stats.errors ? 'red' : 'default'}
          />
        </div>
      )}

      {/* Main Bot Grid & Command Broadcast Deck */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Bot Cards (8 cols) */}
        <Panel className="p-6 lg:col-span-8 border-brand-200 bg-brand-50">
          <div className="flex items-center justify-between pb-4 border-b border-brand-200">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-brand-500" />
              <h3 className="text-base font-bold text-brand-900">Active Bot Deployments</h3>
            </div>
            <Link href="/bots">
              <Button size="sm" variant="ghost" className="text-xs text-brand-500 hover:text-brand-900">
                View All <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <Panel key={i} className="p-4 space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                </Panel>
              ))}
            </div>
          ) : bots.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 pt-4">
              {bots.slice(0, 6).map((bot) => {
                const isRunning = bot.status === 'running';
                const shardVal = typeof bot.shards === 'number' ? bot.shards : null;

                return (
                  <article
                    key={bot.id}
                    className="rounded-2xl border border-brand-200 bg-white p-4 transition-all duration-300 hover:border-brand-200 hover:bg-white flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 font-mono text-xs font-bold uppercase text-brand-900 shadow-inner">
                        {botLabel(bot).slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link href={`/bots?bot=${encodeURIComponent(bot.id)}`} className="block truncate text-xs font-bold text-brand-900 hover:underline">
                          {botLabel(bot)}
                        </Link>
                        <p className="mt-0.5 truncate text-[11px] text-brand-500 flex items-center gap-1.5">
                          <Globe className="h-3 w-3 text-brand-500 shrink-0" />
                          <span>{bot.config?.host || 'No server'}</span>
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-50 border border-brand-200 text-brand-500">
                            {categoryOf(bot)}
                          </span>
                          {shardVal !== null && (
                            <span className="text-[9px] font-mono text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              ✦ {shardVal.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={bot.status} />
                    </div>

                    <div className="flex items-center justify-between border-t border-brand-200 pt-3">
                      <span className="font-mono text-[10px] text-brand-500">#{bot.id}</span>
                      {isRunning ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-300 hover:text-red-200"
                          loading={busy === `${bot.id}:stop`}
                          onClick={() => lifecycle(bot, 'stop')}
                        >
                          <CircleStop className="h-3.5 w-3.5 mr-1" /> Stop
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={busy === `${bot.id}:start`}
                          onClick={() => lifecycle(bot, 'start')}
                        >
                          <Play className="h-3.5 w-3.5 mr-1" /> Start
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Bot}
              title="No bots deployed yet"
              description="Deploy your first autonomous Minecraft worker to begin automated tasks."
              action={
                <Link href="/bots">
                  <Button variant="primary">
                    <Plus className="h-4 w-4 mr-1" />
                    Deploy First Bot
                  </Button>
                </Link>
              }
            />
          )}
        </Panel>

        {/* Right Column: Fleet Command Terminal & Activity Stream */}
        <div className="space-y-6 lg:col-span-4">
          <Panel className="p-6 border-brand-200 bg-brand-50 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-brand-200">
              <Terminal className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-bold text-brand-900">Broadcast Command</h3>
            </div>
            <p className="text-xs text-brand-500">
              Broadcast real-time Minecraft commands across all {stats.running} active bots.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                broadcast();
              }}
              className="space-y-2"
            >
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="e.g. !say Hello everyone, !goto 100 64 200, !mine iron_ore"
                className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-mono text-brand-900 placeholder-brand-400 focus:border-brand-200 focus:outline-none"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full font-semibold"
                loading={sending}
                disabled={!command.trim()}
              >
                <Send className="h-3.5 w-3.5 mr-1" /> Broadcast to All Bots
              </Button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-brand-200">
              {['!status', '!ping', '!shard', '!mine', '!sell', '!drop'].map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => broadcast(cmd)}
                  className="rounded border border-brand-200 bg-brand-50 px-2 py-0.5 font-mono text-[9px] text-brand-500 hover:border-brand-200 hover:text-brand-900 transition"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </Panel>

          {/* Quick Hub Navigation Cards */}
          <Panel className="p-5 border-brand-200 bg-brand-50 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500 block">Workspace Navigation</span>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/tiles"
                className="p-3 rounded-xl border border-brand-200 bg-brand-50 hover:bg-brand-50 transition space-y-1 block"
              >
                <LayoutGrid className="h-4 w-4 text-purple-400" />
                <span className="block text-xs font-bold text-brand-900">Fleet Matrix</span>
                <span className="block text-[10px] text-brand-500">Multi-Console</span>
              </Link>
              <Link
                href="/network"
                className="p-3 rounded-xl border border-brand-200 bg-brand-50 hover:bg-brand-50 transition space-y-1 block"
              >
                <Network className="h-4 w-4 text-emerald-400" />
                <span className="block text-xs font-bold text-brand-900">My Proxies</span>
                <span className="block text-[10px] text-brand-500">SOCKS5 Hub</span>
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
