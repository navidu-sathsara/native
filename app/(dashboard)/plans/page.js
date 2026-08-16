'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  CreditCard, DollarSign, Users, Bot, Network, ShieldCheck,
  TrendingUp, Sliders, Edit3, CheckCircle2, ArrowUpRight,
  RefreshCw, Search, Sparkles, Filter, AlertCircle, Plus, Minus,
  Clock, Trash2, Tag, Calendar, Check, ToggleLeft, ToggleRight, X
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

  // Limited Time Promotional Plans State
  const [promoPlans, setPromoPlans] = useState([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [promoEditingId, setPromoEditingId] = useState(null);
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoForm, setPromoForm] = useState({
    name: '',
    badge: 'LIMITED TIME OFFER',
    price: 4.99,
    period: '/ month',
    maxBots: 15,
    maxProxies: 5,
    features: '15 Dedicated Minecraft Bot Slots\n5 Dedicated SOCKS5 Proxies\nAll Mining & PvP Behavior Modules\nLive SSE Event Stream',
    highlight: true,
    active: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });

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

  const loadPromoPlans = useCallback(async () => {
    if (me?.role !== 'admin') return;
    setPromoLoading(true);
    try {
      const res = await api('/admin/promo-plans');
      if (res.ok && Array.isArray(res.plans)) {
        setPromoPlans(res.plans);
      }
    } catch (err) {
      toast(err.message || 'Failed to load limited time plans', 'error');
    } finally {
      setPromoLoading(false);
    }
  }, [me?.role, toast]);

  useEffect(() => {
    loadData();
    loadPromoPlans();
  }, [loadData, loadPromoPlans]);

  // Open Edit Modal for a user
  const openEditModal = (subscriber) => {
    setSelectedUser(subscriber);
    setFormTier(subscriber.tier || 'free');
    setCustomBots(subscriber.customLimits?.maxBots || subscriber.maxBots || 5);
    setCustomProxies(subscriber.customLimits?.maxProxies || subscriber.maxProxies || 2);
    setRecordPayment(true);
    setModalOpen(true);
  };

  // Open Promo Plan Create / Edit Modal
  const openPromoModal = (plan = null) => {
    if (plan) {
      setPromoEditingId(plan.id);
      setPromoForm({
        name: plan.name || '',
        badge: plan.badge || 'LIMITED TIME OFFER',
        price: plan.price || 4.99,
        period: plan.period || '/ month',
        maxBots: plan.maxBots || 15,
        maxProxies: plan.maxProxies || 5,
        features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
        highlight: plan.highlight !== false,
        active: plan.active !== false,
        expiresAt: plan.expiresAt ? new Date(plan.expiresAt).toISOString().slice(0, 16) : '',
      });
    } else {
      setPromoEditingId(null);
      setPromoForm({
        name: '',
        badge: 'LIMITED TIME DEAL',
        price: 5.99,
        period: '/ month',
        maxBots: 20,
        maxProxies: 10,
        features: '20 Dedicated Minecraft Bot Slots\n10 Dedicated SOCKS5 Proxies\nAuto-AFK & Mining Automation\nLive Real-time SSE Stream\nHot-reloading Visual Scripts',
        highlight: true,
        active: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      });
    }
    setPromoModalOpen(true);
  };

  // Save Promo Plan (Create or Update)
  const savePromoPlan = async (e) => {
    if (e) e.preventDefault();
    if (!promoForm.name.trim()) {
      toast('Please enter a promotional plan name', 'error');
      return;
    }
    setPromoSaving(true);
    try {
      const payload = {
        name: promoForm.name.trim(),
        badge: promoForm.badge.trim(),
        price: parseFloat(promoForm.price) || 4.99,
        period: promoForm.period.trim(),
        maxBots: parseInt(promoForm.maxBots, 10) || 5,
        maxProxies: parseInt(promoForm.maxProxies, 10) || 0,
        features: promoForm.features.split('\n').map(f => f.trim()).filter(Boolean),
        highlight: Boolean(promoForm.highlight),
        active: Boolean(promoForm.active),
        expiresAt: promoForm.expiresAt ? new Date(promoForm.expiresAt).toISOString() : null,
      };

      if (promoEditingId) {
        await api(`/admin/promo-plans/${promoEditingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast(`Updated promo plan "${payload.name}"`, 'success');
      } else {
        await api('/admin/promo-plans', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast(`Created new promo plan "${payload.name}"`, 'success');
      }

      setPromoModalOpen(false);
      await loadPromoPlans();
    } catch (err) {
      toast(err.message || 'Failed to save limited-time plan', 'error');
    } finally {
      setPromoSaving(false);
    }
  };

  // Toggle Promo Plan Active Status
  const togglePromoActive = async (plan) => {
    try {
      await api(`/admin/promo-plans/${plan.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !plan.active }),
      });
      toast(`Promotional plan ${!plan.active ? 'activated' : 'paused'}`, 'info');
      await loadPromoPlans();
    } catch (err) {
      toast(err.message || 'Failed to toggle status', 'error');
    }
  };

  // Delete Promo Plan
  const deletePromoPlan = async (plan) => {
    if (!confirm(`Are you sure you want to delete promo plan "${plan.name}"?`)) return;
    try {
      await api(`/admin/promo-plans/${plan.id}`, {
        method: 'DELETE',
      });
      toast(`Deleted promo plan "${plan.name}"`, 'success');
      await loadPromoPlans();
    } catch (err) {
      toast(err.message || 'Failed to delete plan', 'error');
    }
  };

  // Calculated custom price for modal
  const modalCalculatedPrice = useMemo(() => {
    if (formTier === 'free') return 0;
    if (formTier === 'bronze_3') return 2;
    if (formTier === 'silver_5') return 5;
    if (formTier === 'unlimited_15') return 12;
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
      <div className="p-8 text-center text-ink-soft font-mono">
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
        description="Monitor platform-wide Monthly Recurring Revenue (MRR), manage tenant subscription tiers, and create limited-time promotional deals."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => openPromoModal()}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Create Limited-Time Plan
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { loadData(); loadPromoPlans(); }}
              loading={loading || promoLoading}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh Metrics
            </Button>
          </div>
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

      {/* ── LIMITED TIME & PROMOTIONAL PLANS SECTION ─────────────────── */}
      <Panel className="p-6 border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-rule">
          <div>
            <div className="flex items-center gap-2">
              <span className="border border-ink bg-ember/10 p-1.5 text-ember shadow-[1px_1px_0_#111111]">
                <Clock className="h-4 w-4" />
              </span>
              <h3 className="lp-display text-base font-bold text-ink">Limited-Time & Promotional Flash Deals</h3>
            </div>
            <p className="text-xs text-ink-soft mt-1 font-mono">
              Create special time-limited subscription packages with custom bot quotas and discounted prices visible on the Billing page.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openPromoModal()}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Flash Deal
          </Button>
        </div>

        {promoPlans.length === 0 ? (
          <div className="border border-dashed border-rule bg-paper-2 p-8 text-center font-mono">
            <Tag className="h-6 w-6 mx-auto mb-2 text-ink-faint" />
            <p className="text-xs font-bold text-ink">No promotional plans created yet</p>
            <p className="text-[11px] text-ink-soft mt-1">Create a limited-time deal to offer custom bot capacities or discounts.</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => openPromoModal()}
            >
              + Create First Promotional Plan
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promoPlans.map((plan) => {
              const isExpired = plan.expiresAt && new Date(plan.expiresAt) < new Date();
              return (
                <div
                  key={plan.id}
                  className={`border p-5 flex flex-col justify-between transition relative font-mono ${
                    plan.highlight
                      ? 'border-2 border-ember bg-white shadow-[4px_4px_0_#ff4400]'
                      : 'border-ink/20 bg-white shadow-[2px_2px_0_#111111]'
                  }`}
                >
                  <div>
                    {/* Status and Badge */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-rule">
                      <span className="border border-ember bg-ember text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        {plan.badge}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isExpired ? (
                          <span className="border border-red-500/30 bg-red-500/10 text-red-600 px-1.5 py-0.5 text-[9px] font-bold">
                            EXPIRED
                          </span>
                        ) : plan.active ? (
                          <span className="border border-jade/40 bg-jade/10 text-jade px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 bg-jade animate-pulse rounded-full" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="border border-rule bg-paper-2 text-ink-faint px-1.5 py-0.5 text-[9px] font-bold">
                            PAUSED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Plan Name & Price */}
                    <div className="mt-3">
                      <h4 className="lp-display text-lg font-bold text-ink tracking-tight">{plan.name}</h4>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="lp-display text-3xl font-bold text-ink">${Number(plan.price).toFixed(2)}</span>
                        <span className="text-xs text-ink-soft">{plan.period || '/ month'}</span>
                      </div>
                    </div>

                    {/* Quota breakdown */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs border border-rule bg-paper-2 p-2.5">
                      <div>
                        <span className="block lp-mono text-[9px] text-ink-faint">Bots Quota</span>
                        <strong className="text-ink text-sm font-bold">{plan.maxBots === 9999 ? 'Unlimited (∞)' : `${plan.maxBots} Bots`}</strong>
                      </div>
                      <div>
                        <span className="block lp-mono text-[9px] text-ink-faint">Dedicated Proxies</span>
                        <strong className="text-ink text-sm font-bold">{plan.maxProxies} Proxies</strong>
                      </div>
                    </div>

                    {/* Expiration Note */}
                    {plan.expiresAt && (
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-soft">
                        <Calendar className="h-3 w-3 text-ember" />
                        <span>Expires: {new Date(plan.expiresAt).toLocaleDateString()} {new Date(plan.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}

                    {/* Features list */}
                    {plan.features && plan.features.length > 0 && (
                      <ul className="mt-3 space-y-1 text-[11px] text-ink-soft border-t border-rule pt-2.5">
                        {plan.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check className="h-3 w-3 text-jade shrink-0 mt-0.5" />
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-[10px] text-ink-faint pl-4.5">+{plan.features.length - 3} more perks</li>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="mt-5 pt-3 border-t border-rule flex items-center justify-between gap-2">
                    <button
                      onClick={() => togglePromoActive(plan)}
                      className={`text-xs font-bold px-2 py-1 border transition cursor-pointer ${
                        plan.active
                          ? 'border-rule bg-paper-2 text-ink-soft hover:text-ink'
                          : 'border-jade bg-jade/10 text-jade'
                      }`}
                    >
                      {plan.active ? 'Pause Deal' : 'Activate Deal'}
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPromoModal(plan)}
                        title="Edit deal"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deletePromoPlan(plan)}
                        title="Delete deal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Plan Distribution Breakdown */}
      <Panel className="p-6 border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)]">
        <div className="flex items-center justify-between pb-4 border-b border-rule">
          <div>
            <h3 className="lp-display text-sm font-bold text-ink">Tier Breakdown</h3>
            <p className="text-xs text-ink-soft mt-0.5 font-mono">Active subscriptions across available pricing tiers</p>
          </div>
          <span className="text-xs font-mono text-ink-soft bg-paper-2 border border-rule px-2 py-0.5">
            {metrics.totalUsers} Total Accounts
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 font-mono">
          <div className="border border-rule bg-paper-2 p-3.5 shadow-sm">
            <span className="block lp-mono text-[10px] text-ink-faint">Free Starter ($0)</span>
            <span className="lp-display text-xl font-bold text-ink mt-1 block">
              {metrics.tierDistribution?.free || 0}
            </span>
            <span className="text-[10px] text-ink-soft">1 bot limit</span>
          </div>
          <div className="border border-rule bg-paper-2 p-3.5 shadow-sm">
            <span className="block lp-mono text-[10px] text-ink-faint">Bronze Pro ($2)</span>
            <span className="lp-display text-xl font-bold text-ink mt-1 block">
              {metrics.tierDistribution?.bronze_3 || 0}
            </span>
            <span className="text-[10px] text-ink-soft">3 bots limit</span>
          </div>
          <div className="border border-rule bg-paper-2 p-3.5 shadow-sm">
            <span className="block lp-mono text-[10px] text-ink-faint">Silver Pro ($5)</span>
            <span className="lp-display text-xl font-bold text-ink mt-1 block">
              {metrics.tierDistribution?.silver_5 || 0}
            </span>
            <span className="text-[10px] text-ink-soft">10 bots limit</span>
          </div>
          <div className="border border-rule bg-paper-2 p-3.5 shadow-sm">
            <span className="block lp-mono text-[10px] text-ink-faint">Unlimited ($12)</span>
            <span className="lp-display text-xl font-bold text-ink mt-1 block">
              {metrics.tierDistribution?.unlimited_15 || 0}
            </span>
            <span className="text-[10px] text-ink-soft">∞ bots limit</span>
          </div>
          <div className="border border-rule bg-paper-2 p-3.5 shadow-sm">
            <span className="block lp-mono text-[10px] text-ink-faint">Custom Fleets</span>
            <span className="lp-display text-xl font-bold text-jade mt-1 block">
              {metrics.tierDistribution?.custom || 0}
            </span>
            <span className="text-[10px] text-ink-soft">$0.50/bot + $0.50/proxy</span>
          </div>
        </div>
      </Panel>

      {/* Subscribers Table & Quota Controls */}
      <Panel className="p-6 border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="lp-display text-base font-bold text-ink">Tenant Subscription Roster</h3>
            <p className="text-xs text-ink-soft mt-0.5 font-mono">Manage and override plans and bot quotas for any account</p>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email or ID..."
                className="w-48 sm:w-64 border border-ink bg-white pl-8 pr-3 py-1.5 text-xs font-mono text-ink placeholder-ink-faint focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft pointer-events-none" />
            </div>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="border border-ink bg-white px-3 py-1.5 text-xs font-mono text-ink focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
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
        <div className="overflow-x-auto border border-rule">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-rule bg-paper-2 text-ink-soft lp-mono text-[10px]">
              <tr>
                <th className="px-4 py-3">Tenant Account</th>
                <th className="px-4 py-3">Active Tier</th>
                <th className="px-4 py-3">Capacity Quota</th>
                <th className="px-4 py-3">Monthly Rate</th>
                <th className="px-4 py-3">Payment / Audit</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-soft">
                    <RefreshCw className="h-5 w-5 anim-spin mx-auto mb-2 text-ember" />
                    Loading subscriber roster...
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-soft">
                    No accounts found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => {
                  const isPaid = sub.tier !== 'free' || sub.price > 0;
                  return (
                    <tr key={sub.id} className="hover:bg-paper-2/60 transition">
                      {/* User Column */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 items-center justify-center border border-ink bg-paper-2 text-[10px] font-bold text-ink uppercase shadow-[1px_1px_0_#111111]">
                            {sub.email ? sub.email.slice(0, 2) : 'US'}
                          </span>
                          <div>
                            <span className="block font-bold text-ink">{sub.email}</span>
                            <span className="block text-[10px] text-ink-faint">ID: #{sub.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block border px-2 py-0.5 text-[10px] font-bold uppercase ${
                            sub.tier === 'unlimited_15'
                              ? 'border-ember bg-ember/10 text-ember'
                              : sub.tier === 'custom'
                              ? 'border-jade bg-jade/10 text-jade'
                              : isPaid
                              ? 'border-ink bg-white text-ink'
                              : 'border-rule bg-paper-2 text-ink-soft'
                          }`}
                        >
                          {sub.tierName || sub.tier}
                        </span>
                      </td>

                      {/* Capacity Meter */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-ink font-semibold">
                              {sub.runningBots} / {sub.maxBots === Infinity || sub.maxBots === 9999 ? '∞' : sub.maxBots} Bots
                            </span>
                            <span className="text-ink-faint text-[10px]">({sub.botCount} configured)</span>
                          </div>
                          <div className="text-[10px] text-ink-faint">
                            {sub.maxProxies === Infinity || sub.maxProxies === 9999 ? '∞' : sub.maxProxies} Dedicated Proxies
                          </div>
                        </div>
                      </td>

                      {/* Monthly Rate */}
                      <td className="px-4 py-3.5 font-bold text-ink">
                        {sub.price === 0 ? 'Free ($0.00)' : `$${Number(sub.price).toFixed(2)} / mo`}
                      </td>

                      {/* Payment Status / Audit */}
                      <td className="px-4 py-3.5 text-[11px]">
                        {sub.lastPayment?.paidAt ? (
                          <div>
                            <span className="text-jade font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Paid (${sub.lastPayment.amount || sub.price})
                            </span>
                            <span className="text-[10px] text-ink-faint">
                              {formatDate(sub.lastPayment.paidAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-ink-faint">No online transactions</span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditModal(sub)}
                          className="shadow-[1px_1px_0_#111111]"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Adjust Quota
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ── CREATE / EDIT PROMO PLAN MODAL ───────────────────────────── */}
      <Modal
        open={promoModalOpen}
        onClose={() => setPromoModalOpen(false)}
        title={promoEditingId ? 'Edit Limited-Time Promotional Plan' : 'Create New Limited-Time Promotional Plan'}
        description="Configure a special time-limited offer with custom bot quotas, discounted prices, and countdown timers."
      >
        <form onSubmit={savePromoPlan} className="space-y-4 py-2 font-mono text-xs">
          {/* Plan Name & Badge */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] lp-mono text-ink-soft mb-1 font-bold">Plan Name *</label>
              <input
                type="text"
                required
                value={promoForm.name}
                onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                placeholder="e.g. Flash Fleet Special"
                className="w-full border border-ink bg-white px-3 py-2 text-xs font-mono text-ink focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
              />
            </div>
            <div>
              <label className="block text-[10px] lp-mono text-ink-soft mb-1 font-bold">Promotional Badge Tag</label>
              <input
                type="text"
                value={promoForm.badge}
                onChange={(e) => setPromoForm({ ...promoForm, badge: e.target.value })}
                placeholder="e.g. 50% OFF · LIMITED TIME"
                className="w-full border border-ink bg-white px-3 py-2 text-xs font-mono text-ink focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
              />
            </div>
          </div>

          {/* Price & Billing Period */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] lp-mono text-ink-soft mb-1 font-bold">Price (USD) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  required
                  value={promoForm.price}
                  onChange={(e) => setPromoForm({ ...promoForm, price: e.target.value })}
                  className="w-full border border-ink bg-white pl-7 pr-3 py-2 text-xs font-mono text-ink focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] lp-mono text-ink-soft mb-1 font-bold">Billing Cycle Label</label>
              <input
                type="text"
                value={promoForm.period}
                onChange={(e) => setPromoForm({ ...promoForm, period: e.target.value })}
                placeholder="/ month"
                className="w-full border border-ink bg-white px-3 py-2 text-xs font-mono text-ink focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
              />
            </div>
          </div>

          {/* Quotas: Bots & Dedicated Proxies */}
          <div className="grid sm:grid-cols-2 gap-3 border border-rule bg-paper-2 p-3">
            <div>
              <label className="block text-[10px] lp-mono text-ink-soft mb-1 font-bold">Max Bot Slots</label>
              <input
                type="number"
                min="1"
                max="500"
                value={promoForm.maxBots}
                onChange={(e) => setPromoForm({ ...promoForm, maxBots: parseInt(e.target.value, 10) || 1 })}
                className="w-full border border-ink bg-white px-3 py-2 text-xs font-mono text-ink focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
              />
            </div>
            <div>
              <label className="block text-[10px] lp-mono text-ink-soft mb-1 font-bold">Max Dedicated Proxies</label>
              <input
                type="number"
                min="0"
                max="100"
                value={promoForm.maxProxies}
                onChange={(e) => setPromoForm({ ...promoForm, maxProxies: parseInt(e.target.value, 10) || 0 })}
                className="w-full border border-ink bg-white px-3 py-2 text-xs font-mono text-ink focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
              />
            </div>
          </div>

          {/* Expiration Date & Time */}
          <div>
            <label className="block text-[10px] lp-mono text-ink-soft mb-1 font-bold">Offer Expiration Date & Time (Optional)</label>
            <input
              type="datetime-local"
              value={promoForm.expiresAt}
              onChange={(e) => setPromoForm({ ...promoForm, expiresAt: e.target.value })}
              className="w-full border border-ink bg-white px-3 py-2 text-xs font-mono text-ink focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
            />
            <p className="text-[10px] text-ink-faint mt-1">Leave empty or set date to automatically unpublish the deal when expired.</p>
          </div>

          {/* Features / Highlights list */}
          <div>
            <label className="block text-[10px] lp-mono text-ink-soft mb-1 font-bold">Perks & Features (One per line)</label>
            <textarea
              rows={4}
              value={promoForm.features}
              onChange={(e) => setPromoForm({ ...promoForm, features: e.target.value })}
              placeholder="e.g. 20 Dedicated Bot Slots&#10;Private SOCKS5 Proxies&#10;Live SSE Telemetry"
              className="w-full border border-ink bg-white px-3 py-2 text-xs font-mono text-ink focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
            />
          </div>

          {/* Checkbox Toggles */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={promoForm.highlight}
                onChange={(e) => setPromoForm({ ...promoForm, highlight: e.target.checked })}
                className="h-4 w-4 border-ink accent-[#ff4400]"
              />
              <span className="font-bold text-ink">Featured / Highlight Deal</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={promoForm.active}
                onChange={(e) => setPromoForm({ ...promoForm, active: e.target.checked })}
                className="h-4 w-4 border-ink accent-[#ff4400]"
              />
              <span className="font-bold text-jade">Published & Active</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-rule">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPromoModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={promoSaving}
            >
              <Check className="h-4 w-4 mr-1" />
              {promoEditingId ? 'Save Changes' : 'Publish Promotional Deal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── ADJUST USER SUBSCRIPTION MODAL ───────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Adjust Tenant Subscription & Quota"
        description={`Modify subscription limits and monthly fees for ${selectedUser?.email}`}
      >
        <div className="space-y-5 py-2 font-mono text-xs">
          {/* Target User Summary */}
          <div className="border border-rule bg-paper-2 p-3.5 flex items-center justify-between">
            <div>
              <span className="block font-bold text-ink">{selectedUser?.email}</span>
              <span className="text-[10px] text-ink-faint">User ID: #{selectedUser?.id?.slice(0, 8)}</span>
            </div>
            <span className="border border-ink bg-white px-2 py-0.5 text-[10px] font-bold text-ink">
              Current: {selectedUser?.tierName || selectedUser?.tier}
            </span>
          </div>

          {/* Subscription Tier Selection */}
          <div>
            <label className="block text-[10px] lp-mono text-ink-soft mb-1.5 font-bold">Select Subscription Tier</label>
            <select
              value={formTier}
              onChange={(e) => setFormTier(e.target.value)}
              className="w-full border border-ink bg-white px-3 py-2 text-xs font-mono text-ink focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
            >
              {PLAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Tier Steppers (Shown only if Custom selected) */}
          {formTier === 'custom' && (
            <div className="border border-ink/20 bg-paper-2 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-ink text-xs">Bot Capacity Quota</h4>
                  <p className="text-[10px] text-ink-soft">$0.50 / bot slot</p>
                </div>
                <div className="flex items-center border border-ink bg-white p-0.5 shadow-[1px_1px_0_#111111]">
                  <button
                    type="button"
                    onClick={() => setCustomBots(Math.max(1, customBots - 1))}
                    className="p-1 text-ink-soft hover:text-ink cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="min-w-8 text-center font-bold text-ink text-xs">{customBots}</span>
                  <button
                    type="button"
                    onClick={() => setCustomBots(Math.min(200, customBots + 1))}
                    className="p-1 text-ink-soft hover:text-ink cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-rule">
                <div>
                  <h4 className="font-bold text-ink text-xs">Dedicated SOCKS5 Proxies</h4>
                  <p className="text-[10px] text-ink-soft">$0.50 / proxy slot</p>
                </div>
                <div className="flex items-center border border-ink bg-white p-0.5 shadow-[1px_1px_0_#111111]">
                  <button
                    type="button"
                    onClick={() => setCustomProxies(Math.max(0, customProxies - 1))}
                    className="p-1 text-ink-soft hover:text-ink cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="min-w-8 text-center font-bold text-ink text-xs">{customProxies}</span>
                  <button
                    type="button"
                    onClick={() => setCustomProxies(Math.min(50, customProxies + 1))}
                    className="p-1 text-ink-soft hover:text-ink cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Price Summary Line */}
          <div className="border border-rule bg-paper-2 p-3.5 flex items-baseline justify-between">
            <span className="text-xs text-ink-soft">Calculated Monthly Rate</span>
            <div className="text-right">
              <span className="text-lg font-bold text-ink font-mono">
                ${modalCalculatedPrice.toFixed(2)}
              </span>
              <span className="text-[10px] text-ink-faint ml-1">/ month</span>
            </div>
          </div>

          {/* Audit Checkbox */}
          <label className="flex items-center gap-2 text-xs text-ink-soft cursor-pointer">
            <input
              type="checkbox"
              checked={recordPayment}
              onChange={(e) => setRecordPayment(e.target.checked)}
              className="h-4 w-4 border-ink accent-[#ff4400]"
            />
            <span>Log an admin payment transaction record in account audit history</span>
          </label>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-rule">
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={saveSubscription}
              loading={saving}
            >
              Save Subscription Quota
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
