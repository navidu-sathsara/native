'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  CreditCard, DollarSign, Users, Bot, Network, ShieldCheck,
  TrendingUp, Sliders, Edit3, CheckCircle2, ArrowUpRight,
  RefreshCw, Search, Sparkles, Filter, AlertCircle, Plus, Minus
} from 'lucide-react';
import { useAuth, useToast } from '@/components/providers';
import { Button, Modal, PageHeader, Panel, StatCard, StatusBadge, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

const BOT_UNIT_PRICE = 0.50;
const PROXY_UNIT_PRICE = 0.50;

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free Starter ($0 / mo · 1 Bot)' },
  { value: 'bronze_3', label: 'Bronze Pro ($2 / mo · 3 Bots)' },
  { value: 'silver_5', label: 'Silver Pro ($5 / mo · 10 Bots)' },
  { value: 'unlimited_15', label: 'Unlimited Pro ($12 / mo · ∞ Bots)' },
  { value: 'custom', label: 'Custom Fleet (Dynamic $0.50/bot + $0.50/proxy)' },
];

export default function AdminPlansPage() {
  const { user: me } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  // Edit Subscription Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formTier, setFormTier] = useState('free');
  const [customBots, setCustomBots] = useState(5);
  const [customProxies, setCustomProxies] = useState(2);
  const [recordPayment, setRecordPayment] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (me?.role !== 'admin') return;
    setLoading(true);
    try {
      const res = await api('/admin/plans');
      setData(res);
    } catch (err) {
      toast(err.message || 'Failed to load plans data', 'error');
    } finally {
      setLoading(false);
    }
  }, [me?.role, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Edit Modal for a user
  const openEditModal = (subscriber) => {
    setSelectedUser(subscriber);
    setFormTier(subscriber.tier || 'free');
    setCustomBots(subscriber.customLimits?.maxBots || subscriber.maxBots || 5);
    setCustomProxies(subscriber.customLimits?.maxProxies || subscriber.maxProxies || 2);
    setRecordPayment(true);
    setModalOpen(true);
  };

  // Calculated custom price for modal
  const modalCalculatedPrice = useMemo(() => {
    if (formTier === 'free') return 0;
    if (formTier === 'bronze_3') return 7;
    if (formTier === 'silver_5') return 15;
    if (formTier === 'unlimited_15') return 29;
    return Number(((customBots * BOT_UNIT_PRICE) + (customProxies * PROXY_UNIT_PRICE)).toFixed(2));
  }, [formTier, customBots, customProxies]);

  // Save User Subscription
  const saveSubscription = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const payload = {
        tier: formTier,
        maxBots: formTier === 'custom' ? customBots : undefined,
        maxProxies: formTier === 'custom' ? customProxies : undefined,
        price: modalCalculatedPrice,
        recordPayment,
      };

      await api(`/admin/users/${selectedUser.id}/subscription`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      toast(`Updated subscription for ${selectedUser.email}`, 'success');
      setModalOpen(false);
      await loadData();
    } catch (err) {
      toast(err.message || 'Failed to update subscription', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filter subscribers
  const filteredSubscribers = useMemo(() => {
    if (!data?.subscribers) return [];
    return data.subscribers.filter((s) => {
      const matchesSearch =
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.id?.toLowerCase().includes(search.toLowerCase());
      const matchesTier = tierFilter === 'all' || s.tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [data?.subscribers, search, tierFilter]);

  if (me?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-brand-500">
        Access restricted to Administrators only.
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalUsers: 0,
    activePaidUsers: 0,
    totalMRR: 0,
    totalBotsProvisioned: 0,
    totalProxiesAllocated: 0,
    tierDistribution: {},
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        eyebrow="SaaS Fleet Orchestration"
        title="Plans & Subscriptions Management"
        description="Monitor platform-wide Monthly Recurring Revenue (MRR), manage tenant subscription tiers, and adjust capacity quotas."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            loading={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Metrics
          </Button>
        }
      />

      {/* Top MRR & SaaS Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monthly Recurring Revenue"
          value={`$${metrics.totalMRR.toFixed(2)}`}
          hint="Platform USD revenue / month"
          icon={DollarSign}
          tone="green"
          highlight={true}
        />
        <StatCard
          label="Paid Active Fleets"
          value={`${metrics.activePaidUsers} / ${metrics.totalUsers}`}
          hint={`${metrics.totalUsers ? ((metrics.activePaidUsers / metrics.totalUsers) * 100).toFixed(0) : 0}% Conversion Rate`}
          icon={TrendingUp}
          tone="blue"
        />
        <StatCard
          label="Provisioned Bot Slots"
          value={metrics.totalBotsProvisioned}
          hint="Total concurrent capacity"
          icon={Bot}
          tone="amber"
        />
        <StatCard
          label="Dedicated Proxies"
          value={metrics.totalProxiesAllocated}
          hint="Allocated across all pools"
          icon={Network}
          tone="default"
        />
      </div>

      {/* Plan Distribution Breakdown */}
      <Panel className="p-6 border-brand-200 bg-brand-50">
        <div className="flex items-center justify-between pb-4 border-b border-brand-200">
          <div>
            <h3 className="text-sm font-bold text-brand-900">Tier Breakdown</h3>
            <p className="text-xs text-brand-500 mt-0.5">Active subscriptions across available pricing tiers</p>
          </div>
          <span className="text-xs font-mono text-brand-500">
            {metrics.totalUsers} Total Accounts
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
          <div className="rounded-xl border border-brand-200 bg-white p-3.5">
            <span className="block text-[10px] uppercase font-semibold text-brand-500">Free Starter ($0)</span>
            <span className="text-xl font-bold text-brand-900 mt-1 block">
              {metrics.tierDistribution?.free || 0}
            </span>
            <span className="text-[10px] text-brand-500">1 bot limit</span>
          </div>
          <div className="rounded-xl border border-brand-200 bg-white p-3.5">
            <span className="block text-[10px] uppercase font-semibold text-brand-500">Bronze Pro ($7)</span>
            <span className="text-xl font-bold text-brand-900 mt-1 block">
              {metrics.tierDistribution?.bronze_3 || 0}
            </span>
            <span className="text-[10px] text-brand-500">3 bots limit</span>
          </div>
          <div className="rounded-xl border border-brand-200 bg-white p-3.5">
            <span className="block text-[10px] uppercase font-semibold text-brand-500">Silver Pro ($15)</span>
            <span className="text-xl font-bold text-brand-900 mt-1 block">
              {metrics.tierDistribution?.silver_5 || 0}
            </span>
            <span className="text-[10px] text-brand-500">10 bots limit</span>
          </div>
          <div className="rounded-xl border border-brand-200 bg-white p-3.5">
            <span className="block text-[10px] uppercase font-semibold text-brand-500">Unlimited ($29)</span>
            <span className="text-xl font-bold text-brand-900 mt-1 block">
              {metrics.tierDistribution?.unlimited_15 || 0}
            </span>
            <span className="text-[10px] text-brand-500">∞ bots limit</span>
          </div>
          <div className="rounded-xl border border-brand-200 bg-white p-3.5">
            <span className="block text-[10px] uppercase font-semibold text-brand-500">Custom Fleets</span>
            <span className="text-xl font-bold text-brand-900 mt-1 block text-emerald-400">
              {metrics.tierDistribution?.custom || 0}
            </span>
            <span className="text-[10px] text-brand-500">$0.50/bot + $0.50/proxy</span>
          </div>
        </div>
      </Panel>

      {/* Subscribers Table & Quota Controls */}
      <Panel className="p-6 border-brand-200 bg-brand-50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-brand-900">Tenant Subscription Roster</h3>
            <p className="text-xs text-brand-500 mt-0.5">Manage and override plans and bot quotas for any account</p>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email or ID..."
                className="w-48 sm:w-64 rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs text-brand-900 placeholder-brand-400 focus:border-brand-200 focus:outline-none pl-8"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-500 pointer-events-none" />
            </div>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs text-brand-900 focus:outline-none"
            >
              <option value="all">All Tiers</option>
              <option value="free">Free Starter</option>
              <option value="bronze_3">Bronze Pro</option>
              <option value="silver_5">Silver Pro</option>
              <option value="unlimited_15">Unlimited Pro</option>
              <option value="custom">Custom Fleet</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-xl border border-brand-200">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-brand-200 bg-brand-50 text-brand-500 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Tenant Account</th>
                <th className="px-4 py-3">Active Tier</th>
                <th className="px-4 py-3">Capacity Quota</th>
                <th className="px-4 py-3">Monthly Rate</th>
                <th className="px-4 py-3">Payment / Audit</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-brand-500">
                    <RefreshCw className="h-5 w-5 anim-spin mx-auto mb-2 text-brand-500" />
                    Loading subscriber roster...
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-brand-500">
                    No accounts found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-brand-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-brand-900 flex items-center gap-1.5">
                        {sub.email}
                        {sub.role === 'admin' && (
                          <span className="rounded bg-brand-50 px-1.5 py-0.2 text-[9px] font-bold uppercase text-brand-500">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-brand-500">#{sub.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                        sub.tier === 'unlimited_15'
                          ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                          : sub.tier === 'custom'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : sub.tier !== 'free'
                          ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                          : 'border-brand-200 bg-brand-50 text-brand-500'
                      }`}>
                        {sub.tierName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-brand-900">
                        <strong>{sub.runningBots}</strong> / {sub.maxBots === 9999 ? '∞' : sub.maxBots} Bots running
                      </div>
                      <div className="text-[10px] text-brand-500">
                        {sub.maxProxies === 9999 ? '∞' : sub.maxProxies} Dedicated Proxies ({sub.ownedProxies} pooled)
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-brand-900 text-sm">
                        ${sub.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-brand-500 ml-1">/ mo</span>
                    </td>
                    <td className="px-4 py-3">
                      {sub.lastPayment ? (
                        <div>
                          <span className="text-emerald-400 font-mono text-[11px] block">
                            ${sub.lastPayment.amount?.toFixed(2) || '0.00'} Paid
                          </span>
                          <span className="text-[10px] text-brand-500">
                            {formatDate(sub.lastPayment.paidAt)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-brand-500 text-[11px]">Free Provision</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(sub)}
                        className="text-xs"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit Quota
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Edit Subscription & Capacity Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Edit Quota: ${selectedUser?.email}`}
        description="Override subscription tier and configure dynamic bot and dedicated proxy capacities."
      >
        <div className="space-y-5 py-2">
          {/* Tier Selector */}
          <div>
            <label className="block text-xs font-semibold text-brand-500 mb-1.5">Select Fleet Subscription Tier</label>
            <select
              value={formTier}
              onChange={(e) => setFormTier(e.target.value)}
              className="w-full rounded-xl border border-brand-200 bg-brand-50 p-2.5 text-xs text-brand-900 focus:border-brand-200 focus:outline-none"
            >
              {PLAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Sliders (if Custom Fleet selected) */}
          {formTier === 'custom' && (
            <div className="space-y-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
              {/* Bots Stepper */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-brand-500">Custom Bot Slots ($0.50/bot)</span>
                  <span className="font-bold text-brand-900">{customBots} Bots (${(customBots * BOT_UNIT_PRICE).toFixed(2)}/mo)</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomBots(Math.max(1, customBots - 1))}
                    className="rounded-lg border border-brand-200 p-1.5 text-brand-500 hover:bg-brand-50"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={customBots}
                    onChange={(e) => setCustomBots(parseInt(e.target.value, 10))}
                    className="flex-1 accent-white"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomBots(Math.min(200, customBots + 1))}
                    className="rounded-lg border border-brand-200 p-1.5 text-brand-500 hover:bg-brand-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Proxies Stepper */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-brand-500">Dedicated Proxies ($0.50/proxy)</span>
                  <span className="font-bold text-brand-900">{customProxies} Proxies (${(customProxies * PROXY_UNIT_PRICE).toFixed(2)}/mo)</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomProxies(Math.max(0, customProxies - 1))}
                    className="rounded-lg border border-brand-200 p-1.5 text-brand-500 hover:bg-brand-50"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={customProxies}
                    onChange={(e) => setCustomProxies(parseInt(e.target.value, 10))}
                    className="flex-1 accent-white"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomProxies(Math.min(100, customProxies + 1))}
                    className="rounded-lg border border-brand-200 p-1.5 text-brand-500 hover:bg-brand-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Computed Rate Box */}
          <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-white p-3.5">
            <span className="text-xs text-brand-500">Effective Rate</span>
            <div className="text-right">
              <span className="text-xl font-bold text-brand-900 font-mono">
                ${modalCalculatedPrice.toFixed(2)}
              </span>
              <span className="text-xs text-brand-500 ml-1">USD / month</span>
            </div>
          </div>

          {/* Record payment checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="recordPaymentCheck"
              checked={recordPayment}
              onChange={(e) => setRecordPayment(e.target.checked)}
              className="rounded accent-white"
            />
            <label htmlFor="recordPaymentCheck" className="text-xs text-brand-500 cursor-pointer">
              Record this override in the payment & renewal audit log
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              onClick={saveSubscription}
            >
              Save Quota Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
