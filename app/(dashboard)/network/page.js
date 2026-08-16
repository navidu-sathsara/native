'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Gauge, Network, Plus, RefreshCw, ShieldCheck, Sparkles, Trash2,
  Unplug, WandSparkles, Tag, Globe, Check, AlertCircle, Zap, Shield,
  Search, ArrowRight, Lock
} from 'lucide-react';
import { useDashboard } from '@/components/dashboard-provider';
import { useAuth, useToast } from '@/components/providers';
import { Button, Checkbox, EmptyState, Modal, PageHeader, Panel, StatCard, StatusBadge, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate, proxyLabel } from '@/lib/format';

export default function NetworkPage() {
  const { bots, proxies, proxyCapacity, refreshProxies, refreshBots, loading } = useDashboard();
  const { user } = useAuth();
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [text, setText] = useState('');
  const [replace, setReplace] = useState(false);
  const [isFreeOnAdd, setIsFreeOnAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [onlyWorking, setOnlyWorking] = useState(true);
  const [overwrite, setOverwrite] = useState(false);
  const [noteProxy, setNoteProxy] = useState(null);
  const [note, setNote] = useState('');
  const [noteIsFree, setNoteIsFree] = useState(false);
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState('all'); // 'all', 'free', 'private'

  const isAdmin = user?.role === 'admin';
  const userTier = user?.preferences?.tier || 'free';
  const isFreeTier = userTier === 'free' && !isAdmin;
  const customLimits = user?.preferences?.customLimits;

  const stats = useMemo(() => {
    const used = proxies.reduce((sum, proxy) => sum + proxyCapacity - Number(proxy.freeSlots ?? proxyCapacity), 0);
    const capacity = proxies.length * proxyCapacity;
    const freePoolCount = proxies.filter((p) => p.isFree).length;
    const privatePoolCount = proxies.filter((p) => !p.isFree).length;
    const healthy = proxies.filter((proxy) => proxy.alive).length;
    return {
      used,
      capacity,
      free: Math.max(0, capacity - used),
      healthy,
      failed: proxies.filter((proxy) => proxy.lastCheck && !proxy.alive).length,
      freePoolCount,
      privatePoolCount,
    };
  }, [proxies, proxyCapacity]);

  const filteredProxies = useMemo(() => {
    return proxies.filter((p) => {
      const matchSearch =
        (p.host || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.label || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.note || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.ownerLabel || '').toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (tabFilter === 'free') return !!p.isFree;
      if (tabFilter === 'private') return !p.isFree;
      return true;
    });
  }, [proxies, search, tabFilter]);

  const add = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await api('/proxies', { method: 'POST', body: JSON.stringify({ text, replace, isFree: isFreeOnAdd }) });
      await refreshProxies();
      toast('SOCKS5 proxy pool updated successfully', 'success');
      setAddOpen(false);
      setText('');
      setReplace(false);
      setIsFreeOnAdd(false);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const checkAll = async () => {
    setChecking(true);
    try {
      const result = await api('/proxies/check-all', { method: 'POST', body: '{}' });
      await refreshProxies();
      toast(`${result.working || 0} online · ${result.failed || 0} offline`, result.failed ? 'warning' : 'success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setChecking(false);
    }
  };

  const assign = async () => {
    setAssigning(true);
    try {
      const result = await api('/proxies/assign', { method: 'POST', body: JSON.stringify({ onlyWorking, overwrite }) });
      await Promise.all([refreshProxies(), refreshBots()]);
      toast(`Distributed ${result.assigned?.length || 0} bot${result.assigned?.length === 1 ? '' : 's'} across healthy proxies`, 'success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setAssigning(false);
    }
  };

  const checkOne = async (proxy) => {
    try {
      const result = await api(`/proxies/${encodeURIComponent(proxy.id)}/check`, { method: 'POST', body: '{}' });
      await refreshProxies();
      toast(result.check?.ok ? `${proxyLabel(proxy)} is online (${result.check.ms}ms)` : `${proxyLabel(proxy)} failed connection`, result.check?.ok ? 'success' : 'warning');
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const toggleFreeStatus = async (proxy) => {
    if (!isAdmin) return;
    try {
      const nextFree = !proxy.isFree;
      await api(`/proxies/${encodeURIComponent(proxy.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ isFree: nextFree }),
      });
      await refreshProxies();
      toast(nextFree ? `${proxyLabel(proxy)} designated as Free Tier Proxy` : `${proxyLabel(proxy)} removed from Free Pool`, 'success');
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const remove = async (proxy) => {
    if (!window.confirm(`Remove ${proxyLabel(proxy)} from your proxy pool?`)) return;
    try {
      const result = await api(`/proxies/${encodeURIComponent(proxy.id)}`, { method: 'DELETE' });
      await Promise.all([refreshProxies(), refreshBots()]);
      toast(result.detached ? `Proxy removed · ${result.detached} bot(s) detached` : 'Proxy removed', 'success');
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const saveNote = async () => {
    try {
      const body = { note };
      if (isAdmin) body.isFree = noteIsFree;
      await api(`/proxies/${encodeURIComponent(noteProxy.id)}`, { method: 'PATCH', body: JSON.stringify(body) });
      await refreshProxies();
      setNoteProxy(null);
      toast('Proxy settings updated', 'success');
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        eyebrow={isAdmin ? 'Super Admin Proxy Control' : 'Network & Proxy Tunneling'}
        title={isAdmin ? 'Master Proxy Infrastructure' : 'My SOCKS5 Proxies'}
        description={
          isAdmin
            ? 'Manage system-wide SOCKS5 endpoints, configure free tier starter pools, and probe latency.'
            : 'Bring your own private SOCKS5 proxies or route workers through dedicated low-latency tunnels.'
        }
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={assign} loading={assigning} variant="secondary">
              <WandSparkles className="h-3.5 w-3.5 mr-1" /> Auto-Assign
            </Button>
            <Button size="sm" onClick={checkAll} loading={checking} variant="secondary">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Probe All
            </Button>
            {!isFreeTier && (
              <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Proxies
              </Button>
            )}
          </div>
        }
      />

      {/* Free Tier Info / Upgrade Banner */}
      {isFreeTier && (
        <Panel className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-amber-500/20 bg-amber-500/[0.03]">
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-400">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-brand-900">Free Starter Plan: High-Speed Free Proxy Pool</h3>
              <p className="text-xs text-brand-500 mt-0.5">
                Your bots automatically dial verified Admin Free Proxies. Upgrade to custom fleet to bring unlimited private proxies ($0.60/proxy).
              </p>
            </div>
          </div>
          <Link href="/billing">
            <Button size="sm" variant="primary" className="shrink-0 font-semibold">
              <Zap className="h-3.5 w-3.5 mr-1 fill-black" />
              Upgrade to Custom Pool
            </Button>
          </Link>
        </Panel>
      )}

      {/* KPI Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Panel key={i} className="p-5 flex justify-between items-start min-h-32">
              <div className="space-y-3 w-full">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-9 w-9" />
            </Panel>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Total Endpoints" value={proxies.length} icon={Network} />
          <StatCard label="Online & Verified" value={stats.healthy} icon={ShieldCheck} tone="green" />
          <StatCard label="Free Tier Pool" value={stats.freePoolCount} hint="Allocated for starter tier" icon={Sparkles} tone="amber" />
          <StatCard label="Slots Assigned" value={stats.used} hint={`${stats.capacity} total bot slots`} icon={Gauge} tone="blue" />
          <StatCard label="Slots Free" value={stats.free} hint={`${proxyCapacity} bots per IP exit`} icon={Unplug} />
        </div>
      )}

      {/* Filter & Search Bar */}
      <Panel className="p-4 border-brand-200 bg-brand-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex rounded-xl border border-brand-200 bg-brand-50 p-1">
          <button
            onClick={() => setTabFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              tabFilter === 'all' ? 'bg-brand-50 text-brand-900 font-bold shadow' : 'text-brand-500 hover:text-brand-900'
            }`}
          >
            All Endpoints ({proxies.length})
          </button>
          <button
            onClick={() => setTabFilter('free')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              tabFilter === 'free' ? 'bg-brand-50 text-brand-900 font-bold shadow' : 'text-brand-500 hover:text-brand-900'
            }`}
          >
            Free Tier ({stats.freePoolCount})
          </button>
          <button
            onClick={() => setTabFilter('private')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              tabFilter === 'private' ? 'bg-brand-50 text-brand-900 font-bold shadow' : 'text-brand-500 hover:text-brand-900'
            }`}
          >
            Private / Dedicated ({stats.privatePoolCount})
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search IP, host, note..."
            className="w-full sm:w-64 rounded-xl border border-brand-200 bg-white px-3 py-1.5 text-xs text-brand-900 placeholder-brand-400 focus:border-brand-200 focus:outline-none pl-8"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-500 pointer-events-none" />
        </div>
      </Panel>

      {/* Main Proxies Table */}
      {loading ? (
        <Panel className="p-6 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Panel>
      ) : filteredProxies.length ? (
        <Panel className="overflow-hidden border-brand-200 bg-brand-50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-brand-200 bg-brand-50 text-brand-500 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Proxy Endpoint</th>
                  <th className="px-4 py-3">Tier Route</th>
                  <th className="px-4 py-3">Health & Latency</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Assigned Workers</th>
                  <th className="px-4 py-3">Owner / Note</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredProxies.map((proxy) => {
                  const used = proxyCapacity - Number(proxy.freeSlots ?? proxyCapacity);
                  return (
                    <tr key={proxy.id} className="hover:bg-brand-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-bold text-brand-900 flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-brand-500" />
                          {proxyLabel(proxy)}
                        </div>
                        <div className="text-[10px] text-brand-500 mt-0.5">
                          {proxy.hasAuth ? 'Authenticated SOCKS5' : 'Open SOCKS5'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {proxy.isFree ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                            <Sparkles className="h-3 w-3" /> Free Tier Pool
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-2 py-0.5 text-[10px] text-brand-500">
                            Private SOCKS5
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={proxy.lastCheck ? (proxy.alive ? 'online' : 'error') : 'pending'} />
                          {proxy.latency && (
                            <span className="font-mono text-[10px] text-brand-500">{proxy.latency}ms</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-mono text-brand-900">
                          {used}/{proxyCapacity}
                        </div>
                        <div className="mt-1 h-1 w-20 overflow-hidden rounded bg-brand-50">
                          <div
                            className="h-full bg-white rounded"
                            style={{ width: `${Math.min(100, (used / proxyCapacity) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {(proxy.assignedTo || []).length ? (
                            proxy.assignedTo.map((item) => (
                              <span key={item.id || item} className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] text-brand-500">
                                {item.username || item.id || item}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-brand-500 font-mono">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setNoteProxy(proxy);
                            setNote(proxy.note || '');
                            setNoteIsFree(!!proxy.isFree);
                          }}
                          className="text-left text-xs text-brand-500 hover:text-brand-900"
                        >
                          <span className="block truncate font-medium">{proxy.ownerLabel || 'My Pool'}</span>
                          <span className="block truncate text-[10px] text-brand-500">{proxy.note || 'Click to add note'}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant={proxy.isFree ? 'secondary' : 'ghost'}
                              title={proxy.isFree ? 'Remove from Free Tier pool' : 'Mark as Admin Free Proxy'}
                              onClick={() => toggleFreeStatus(proxy)}
                              className="text-xs"
                            >
                              <Sparkles className={`h-3 w-3 ${proxy.isFree ? 'text-amber-400' : 'text-brand-500'}`} />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => checkOne(proxy)}>
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          {!isFreeTier && (
                            <Button size="sm" variant="danger" onClick={() => remove(proxy)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : (
        <Panel className="p-8">
          <EmptyState
            icon={Network}
            title="No proxies configured"
            description="Add private SOCKS5 endpoints to tunnel bots through isolated residential or datacenter IPs."
            action={
              !isFreeTier ? (
                <Button variant="primary" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Proxies
                </Button>
              ) : null
            }
          />
        </Panel>
      )}

      {/* MODAL: Add Proxies */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Import SOCKS5 Proxies"
        description="Paste one proxy endpoint per line. Supported formats: host:port, host:port:user:pass, socks5://..."
      >
        <div className="space-y-4 py-2">
          <textarea
            className="w-full min-h-44 rounded-xl border border-brand-200 bg-white p-3 font-mono text-xs text-brand-900 placeholder-brand-400 focus:border-brand-200 focus:outline-none"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={'1.2.3.4:1080\n5.6.7.8:1080:username:password\nsocks5://user:pass@1.2.3.4:1080'}
          />

          <div className="space-y-2">
            <Checkbox
              checked={replace}
              onChange={setReplace}
              label="Replace existing pool"
              description="Removes current proxies owned by this account before importing."
            />
            {isAdmin && (
              <Checkbox
                checked={isFreeOnAdd}
                onChange={setIsFreeOnAdd}
                label="Import directly into Admin Free Tier Pool"
                description="Makes these endpoints available to Free Plan starter bots."
              />
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-brand-200 pt-4 mt-4">
            <Button onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={add} loading={submitting} disabled={!text.trim()}>
              Import Endpoints
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Edit Note & Toggle Free Status */}
      <Modal
        open={!!noteProxy}
        onClose={() => setNoteProxy(null)}
        title="Proxy Endpoint Settings"
        description={noteProxy ? proxyLabel(noteProxy) : ''}
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-brand-500 mb-1.5">Internal Label / Note</label>
            <input
              className="w-full rounded-xl border border-brand-200 bg-white p-2.5 text-xs text-brand-900 focus:border-brand-200 focus:outline-none"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Residential · Germany / Proxy Seller A"
            />
          </div>

          {isAdmin && (
            <Checkbox
              checked={noteIsFree}
              onChange={setNoteIsFree}
              label="Designate as Admin Free Proxy"
              description="Allows Free Plan users to connect bots through this proxy automatically."
            />
          )}

          <div className="flex justify-end gap-2 border-t border-brand-200 pt-4 mt-4">
            <Button onClick={() => setNoteProxy(null)}>Cancel</Button>
            <Button variant="primary" onClick={saveNote}>
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
