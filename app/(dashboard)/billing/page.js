'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import {
  CreditCard, ShieldCheck, Zap, Sparkles, CheckCircle2, Bot,
  Network, Lock, X, AlertCircle, Sliders, Layers, ArrowRight,
  Plus, Minus, RefreshCw, Check, Info, Server, Cpu, Shield,
  DollarSign, Globe, CheckCheck
} from 'lucide-react';
import { useAuth, useToast } from '@/components/providers';
import { Button, Modal, PageHeader, Panel, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';

const BOT_UNIT_PRICE = 0.50;   // $0.50 per bot / month
const PROXY_UNIT_PRICE = 0.50; // $0.50 per dedicated proxy / month

const PRESET_PLANS = [
  {
    id: 'free',
    name: 'Free Starter',
    price: '$0',
    amount: 0,
    badge: 'Always Free',
    description: 'Perfect for testing out autonomous bots and basic grinds',
    features: [
      '1 Minecraft Bot running concurrently',
      'Admin Free Proxy access only',
      'Live Web Console & Inventory view',
      'Basic Modules & Automation',
    ],
    limit: 1,
    proxiesLimit: 0,
    highlight: false,
  },
  {
    id: 'bronze_3',
    name: 'Bronze Pro',
    price: '$2',
    amount: 2,
    period: '/mo',
    badge: 'Starter Squad',
    description: 'Ideal for small bot farms and personal server grinds',
    features: [
      'Up to 3 Minecraft Bots running',
      'Use any private SOCKS5 proxies',
      'All Behavior Modules enabled',
      'Fast console streaming latency',
    ],
    limit: 3,
    proxiesLimit: 3,
    highlight: false,
  },
  {
    id: 'silver_5',
    name: 'Silver Pro',
    price: '$5',
    amount: 5,
    period: '/mo',
    badge: 'Most Popular',
    description: 'Designed for serious bot operators and faction clans',
    features: [
      'Up to 10 Minecraft Bots running',
      'Custom SOCKS5 Proxy pool support',
      'Visual Command & Script Builder',
      'Scheduled actions & Auto-reconnect',
    ],
    limit: 10,
    proxiesLimit: 10,
    highlight: true,
  },
  {
    id: 'unlimited_15',
    name: 'Unlimited Pro',
    price: '$12',
    amount: 12,
    period: '/mo',
    badge: 'Enterprise Fleet',
    description: 'Unlimited bot power for massive multi-server operations',
    features: [
      'Unlimited (∞) Minecraft Bots running',
      'Dedicated & Custom SOCKS5 Proxies',
      'Mass Broadcast & Custom Aliases',
      '24/7 Priority Processing',
    ],
    limit: 9999,
    proxiesLimit: 9999,
    highlight: false,
  },
];

export default function BillingPage() {
  const { user, setUser, refresh } = useAuth();
  const { toast } = useToast();

  // Active view tab: 'custom' or 'preset'
  const [viewMode, setViewMode] = useState('preset');

  // Custom Plan Builder State
  const [customBots, setCustomBots] = useState(5);
  const [customProxies, setCustomProxies] = useState(2);

  // Payment & Subscription State

  const [activePlan, setActivePlan] = useState(user?.preferences?.tier || 'free');
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.preferences?.tier) {
      setActivePlan(user.preferences.tier);
    }
  }, [user]);

  // Handle Stripe Redirection Success / Cancel
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const cancel = params.get('cancel');

    if (sessionId) {
      setLoading(true);
      api('/billing/stripe-verify', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId })
      })
      .then(res => {
        if (res.ok) {
          toast('🎉 Payment verified! Subscription is active.', 'success');
          setUser(prev => ({
            ...prev,
            preferences: res.preferences || prev.preferences
          }));
          setActivePlan(res.tier);
        } else {
          toast(`Verification failed: ${res.reason}`, 'error');
        }
      })
      .catch(err => {
        toast(`Verification error: ${err.message}`, 'error');
      })
      .finally(() => {
        setLoading(false);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }

    if (cancel) {
      toast('Payment was cancelled.', 'info');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Calculated Custom Plan Pricing
  const customCalculation = useMemo(() => {
    const botsTotal = customBots * BOT_UNIT_PRICE;
    const proxiesTotal = customProxies * PROXY_UNIT_PRICE;
    const total = Number((botsTotal + proxiesTotal).toFixed(2));
    return {
      botsCount: customBots,
      proxiesCount: customProxies,
      botsTotal: Number(botsTotal.toFixed(2)),
      proxiesTotal: Number(proxiesTotal.toFixed(2)),
      totalPrice: total,
      formattedPrice: `$${total.toFixed(2)}`,
    };
  }, [customBots, customProxies]);

  // Proceed to Stripe Checkout
  const proceedToCheckout = async () => {
    if (!selectedPlanForPayment) return;
    setLoading(true);
    try {
      const payload = {
        planId: selectedPlanForPayment.id,
        customLimits: selectedPlanForPayment.isCustom ? selectedPlanForPayment.customLimits : undefined,
        returnUrl: window.location.origin,
      };

      const res = await api('/billing/stripe-checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok && res.url) {
        window.location.href = res.url;
      } else {
        toast(res.reason || 'Failed to initialize checkout', 'error');
        setLoading(false);
      }
    } catch (err) {
      toast(err.message || 'Checkout connection failed', 'error');
      setLoading(false);
    }
  };

  // Change subscription locally for Free plan
  const downgradeToFree = async () => {
    setLoading(true);
    try {
      const res = await api('/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ tier: 'free' }),
      });
      setUser({ ...user, preferences: { ...user.preferences, tier: 'free', customLimits: null } });
      setActivePlan('free');
      toast('Subscribed to Free Starter plan', 'info');
      await refresh();
      setCheckoutModalOpen(false);
      setSelectedPlanForPayment(null);
    } catch (err) {
      toast(err.message || 'Downgrade failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open checkout modal for preset plan
  const initiatePresetPayment = (plan) => {
    if (plan.id === 'free') {
      downgradeToFree();
      return;
    }
    setSelectedPlanForPayment({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      amount: plan.amount,
      limit: plan.limit,
      proxiesLimit: plan.proxiesLimit,
      isCustom: false,
    });
    setCheckoutModalOpen(true);
  };

  // Open checkout modal for custom configured plan
  const initiateCustomPayment = () => {
    setSelectedPlanForPayment({
      id: 'custom',
      name: `Custom Fleet (${customCalculation.botsCount} Bots)`,
      price: customCalculation.formattedPrice,
      amount: customCalculation.totalPrice,
      limit: customCalculation.botsCount,
      proxiesLimit: customCalculation.proxiesCount,
      isCustom: true,
      customLimits: {
        maxBots: customCalculation.botsCount,
        maxProxies: customCalculation.proxiesCount,
        price: customCalculation.totalPrice,
      },
    });
    setCheckoutModalOpen(true);
  };



  // Determine current active plan description
  const userTier = user?.preferences?.tier || 'free';
  const customLimits = user?.preferences?.customLimits;
  const currentPlanTitle = userTier === 'custom'
    ? `Custom (${customLimits?.maxBots || 1} Bots${customLimits?.maxProxies ? `, ${customLimits.maxProxies} Proxies` : ''})`
    : PRESET_PLANS.find((p) => p.id === userTier)?.name || 'Free Starter';

  const currentBotLimit = userTier === 'custom'
    ? (customLimits?.maxBots || 1)
    : (PRESET_PLANS.find((p) => p.id === userTier)?.limit || 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        eyebrow="Fleet Scalability & Real-Time Billing"
        title="Plans & Billing"
        description="Choose a preset package or scale dynamically with $0.50/bot and $0.50/proxy pricing."
        actions={
          <div className="flex rounded-xl border border-brand-200 bg-brand-100 p-1">
            <button
              onClick={() => setViewMode('preset')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                viewMode === 'preset'
                  ? 'bg-white text-brand-900 shadow-sm'
                  : 'text-brand-500 hover:text-brand-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Preset Packages
            </button>
            <button
              onClick={() => setViewMode('custom')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                viewMode === 'custom'
                  ? 'bg-white text-brand-900 shadow-sm'
                  : 'text-brand-500 hover:text-brand-900'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              Custom Fleet Builder
            </button>
          </div>
        }
      />

      {/* Subscription Status Banner */}
      <Panel className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-brand-200 bg-brand-50">
        <div className="flex items-center gap-4">
          <span className="rounded-2xl border border-brand-200 bg-brand-50 p-3.5 text-brand-900 shadow-inner">
            <CreditCard className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-brand-900 tracking-tight">{currentPlanTitle}</h2>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                Active Tier
              </span>
            </div>
            <p className="text-xs text-brand-500 mt-1 flex items-center gap-3">
              <span>
                Bot capacity: <strong className="text-brand-900">{currentBotLimit === 9999 ? 'Unlimited (∞)' : `${currentBotLimit} bot(s)`}</strong>
              </span>
              {customLimits?.maxProxies > 0 && (
                <span>
                  • Dedicated proxies: <strong className="text-brand-900">{customLimits.maxProxies}</strong>
                </span>
              )}
              {user?.preferences?.lastPayment?.paidAt && (
                <span className="text-brand-500 hidden sm:inline">
                  • Renewed: {new Date(user.preferences.lastPayment.paidAt).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right sm:block hidden border-r border-brand-200 pr-4">
            <span className="block text-[10px] uppercase font-semibold text-brand-500 tracking-wider">Tenant ID</span>
            <span className="font-mono text-xs text-brand-500">#{user?.id?.slice(0, 8) || 'local'}</span>
          </div>
          {userTier !== 'free' && (
            <Button
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => changeSubscriptionLocal('free', 'downgrade')}
              className="text-xs text-brand-500 hover:text-red-300"
            >
              Downgrade to Free
            </Button>
          )}
        </div>
      </Panel>

      {/* ========================================================================= */}
      {/* 🛠️ VIEW 1: CUSTOM PLAN BUILDER                                            */}
      {/* ========================================================================= */}
      {viewMode === 'custom' && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Controls Box (8 cols) */}
          <Panel className="p-7 lg:col-span-8 space-y-8 border-brand-200 bg-brand-50">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-brand-50 p-1.5 text-brand-900">
                  <Sliders className="h-4 w-4" />
                </span>
                <h3 className="text-base font-bold text-brand-900 tracking-tight">Custom Fleet Configurator</h3>
              </div>
              <p className="text-xs text-brand-500 mt-1.5">
                Scale your fleet precisely. Pay only for the exact bot slots and dedicated proxies you need.
              </p>
            </div>

            {/* Slider 1: Bots Configuration */}
            <div className="rounded-2xl border border-brand-200 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bot className="h-4 w-4 text-brand-500" />
                  <div>
                    <h4 className="text-sm font-semibold text-brand-900">Minecraft Bot Capacity</h4>
                    <p className="text-[11px] text-brand-500">$0.50 / bot per month</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-brand-200 bg-brand-50 p-1">
                    <button
                      type="button"
                      onClick={() => setCustomBots(Math.max(1, customBots - 1))}
                      className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-900 transition"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-10 text-center font-mono text-sm font-bold text-brand-900">
                      {customBots}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomBots(Math.min(100, customBots + 1))}
                      className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-900 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-brand-500 min-w-16 text-right">
                    ${(customBots * BOT_UNIT_PRICE).toFixed(2)}/mo
                  </span>
                </div>
              </div>

              {/* Range slider */}
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={customBots}
                onChange={(e) => setCustomBots(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-brand-50 rounded-lg appearance-none cursor-pointer accent-white"
              />

              {/* Quick bot chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[1, 3, 5, 10, 20, 30, 50].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setCustomBots(b)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                      customBots === b
                        ? 'border-brand-200 bg-brand-50 text-brand-900 font-semibold'
                        : 'border-brand-200 bg-brand-50 text-brand-500 hover:border-brand-200 hover:text-brand-900'
                    }`}
                  >
                    {b} {b === 1 ? 'Bot' : 'Bots'} (${(b * BOT_UNIT_PRICE).toFixed(2)})
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 2: Dedicated Premium Proxies Configuration */}
            <div className="rounded-2xl border border-brand-200 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Network className="h-4 w-4 text-brand-500" />
                  <div>
                    <h4 className="text-sm font-semibold text-brand-900">Dedicated Premium SOCKS5 Proxies</h4>
                    <p className="text-[11px] text-brand-500">$0.50 / proxy per month (or bring your own)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-brand-200 bg-brand-50 p-1">
                    <button
                      type="button"
                      onClick={() => setCustomProxies(Math.max(0, customProxies - 1))}
                      className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-900 transition"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-10 text-center font-mono text-sm font-bold text-brand-900">
                      {customProxies}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomProxies(Math.min(30, customProxies + 1))}
                      className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-900 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-brand-500 min-w-16 text-right">
                    ${(customProxies * PROXY_UNIT_PRICE).toFixed(2)}/mo
                  </span>
                </div>
              </div>

              {/* Range slider */}
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={customProxies}
                onChange={(e) => setCustomProxies(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-brand-50 rounded-lg appearance-none cursor-pointer accent-white"
              />

              {/* Quick proxy chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[0, 1, 2, 5, 10, 15, 20].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCustomProxies(p)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                      customProxies === p
                        ? 'border-brand-200 bg-brand-50 text-brand-900 font-semibold'
                        : 'border-brand-200 bg-brand-50 text-brand-500 hover:border-brand-200 hover:text-brand-900'
                    }`}
                  >
                    {p === 0 ? '0 (Bring Own)' : `${p} Proxies ($${(p * PROXY_UNIT_PRICE).toFixed(2)})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Included Platform Perks */}
            <div className="pt-2 border-t border-brand-200 grid sm:grid-cols-2 gap-3 text-xs text-brand-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Private SOCKS5 Proxy Dialing unlocked</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Live Real-Time SSE Log & Inventory streaming</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>All Mining, PvP & Auto-Farm modules enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Hot-reloading Visual Scripts & Cron Schedules</span>
              </div>
            </div>
          </Panel>

          {/* Right Column: Pricing Summary & Instant Checkout */}
          <Panel className="p-7 lg:col-span-4 flex flex-col justify-between border-brand-200 bg-brand-50 shadow-sm relative overflow-hidden">
            <div className="space-y-6">
              <div>
                <span className="inline-block rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-900">
                  Order Summary
                </span>
                <h3 className="text-xl font-bold text-brand-900 mt-3">Calculated Price</h3>
                <p className="text-xs text-brand-500 mt-1">Instant provisioning upon checkout</p>
              </div>

              {/* Cost breakdown */}
              <div className="space-y-3 rounded-2xl border border-brand-200 bg-white p-4 text-xs">
                <div className="flex items-center justify-between text-brand-500">
                  <span>{customCalculation.botsCount} × Bot Slots ($0.50)</span>
                  <span className="font-mono font-medium text-brand-900">${customCalculation.botsTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-brand-500">
                  <span>{customCalculation.proxiesCount} × Proxies ($0.50)</span>
                  <span className="font-mono font-medium text-brand-900">${customCalculation.proxiesTotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-brand-200 pt-3 flex items-baseline justify-between">
                  <span className="font-semibold text-brand-900">Total Monthly</span>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-brand-900 tracking-tight">
                      ${customCalculation.totalPrice.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-brand-500 ml-1">/ mo</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-[11px] text-brand-500">
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
                  <span>Cancel or adjust capacity anytime with zero lock-in</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-brand-500" />
                  <span>Real 256-bit encrypted checkout via PayPal & Cards</span>
                </p>
              </div>
            </div>

            <div className="mt-8">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-lg"
                onClick={initiateCustomPayment}
              >
                <Zap className="h-4 w-4 mr-1.5 fill-black" />
                Deploy Custom Fleet ({customCalculation.formattedPrice})
              </Button>
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📦 VIEW 2: PRESET PACKAGES                                                */}
      {/* ========================================================================= */}
      {viewMode === 'preset' && (
        <div className="grid gap-6 lg:grid-cols-4">
          {PRESET_PLANS.map((plan) => {
            const isCurrent = activePlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl p-8 transition-transform duration-500 hover:-translate-y-1 ${
                  plan.highlight
                    ? 'bg-white shadow-xl border-2 border-blurple-500 z-10 scale-[1.02]'
                    : 'bg-white border border-brand-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Active Plan or Badge */}
                <div className="mb-6 flex justify-between items-start">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${
                      isCurrent
                        ? 'bg-emerald-100 text-emerald-700'
                        : plan.highlight
                        ? 'bg-blurple-500 text-white'
                        : 'bg-brand-100 text-brand-700'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : plan.badge}
                  </span>
                  {plan.highlight && !isCurrent && (
                    <Sparkles className="h-5 w-5 text-blurple-500" />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-brand-900">{plan.name}</h3>
                  
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold tracking-tight text-brand-900">{plan.price}</span>
                    {plan.period && <span className="text-sm font-medium text-brand-500">{plan.period}</span>}
                  </div>
                  
                  <p className="mt-4 text-sm text-brand-600 leading-relaxed min-h-[40px]">
                    {plan.description}
                  </p>

                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className={`h-5 w-5 shrink-0 ${plan.highlight ? 'text-blurple-500' : 'text-brand-400'}`} />
                        <span className="text-sm font-medium text-brand-700 leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-10">
                  {plan.id === 'free' ? (
                    <button
                      className={`w-full h-12 rounded-xl text-sm font-bold transition-all ${
                        isCurrent 
                          ? 'bg-brand-50 text-brand-500 cursor-not-allowed'
                          : 'bg-white border border-brand-200 text-brand-900 hover:bg-brand-50 shadow-sm'
                      }`}
                      disabled={isCurrent || loading}
                      onClick={() => changeSubscriptionLocal('free', 'free_downgrade')}
                    >
                      {isCurrent ? 'Active Plan' : 'Downgrade to Free'}
                    </button>
                  ) : (
                    <button
                      className={`w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-brand-50 text-brand-500 cursor-not-allowed border border-brand-200'
                          : plan.highlight
                          ? 'bg-blurple-500 text-white hover:bg-blurple-600 shadow-md hover:shadow-lg'
                          : 'bg-white border border-brand-200 text-brand-900 hover:bg-brand-50 shadow-sm'
                      }`}
                      disabled={isCurrent || loading}
                      onClick={() => initiatePresetPayment(plan)}
                    >
                      {loading && selectedPlanForPayment?.id === plan.id ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        !isCurrent && <Zap className="h-4 w-4 mr-2 fill-current" />
                      )}
                      {isCurrent ? 'Subscribed' : `Upgrade (${plan.price})`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💳 REAL CHECKOUT & SECURE PAYMENT MODAL                                   */}
      {/* ========================================================================= */}
      <Modal
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="Secure Checkout"
        description="Complete payment securely via Stripe to activate your fleet."
        wide={false}
      >
        <div className="space-y-5 py-2">
          
          {/* Itemized Order Summary Box */}
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-200">
              <div>
                <h4 className="text-sm font-bold text-brand-900">{selectedPlanForPayment?.name}</h4>
                <p className="text-xs text-brand-500 mt-0.5">
                  {selectedPlanForPayment?.isCustom
                    ? `${selectedPlanForPayment.limit} Bots + ${selectedPlanForPayment.proxiesLimit} Dedicated Proxies`
                    : `Capacity: ${selectedPlanForPayment?.limit === 9999 ? 'Unlimited' : selectedPlanForPayment?.limit} Bots`}
                </p>
              </div>
              <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] px-2.5 py-1 font-semibold">
                Instant Access
              </span>
            </div>

            {/* Price Line */}
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs text-brand-500">Total Amount Due</span>
              <div className="text-right">
                <span className="text-2xl font-black text-brand-900 font-mono">
                  {selectedPlanForPayment?.price}
                </span>
                <span className="text-xs text-brand-500 ml-1">USD / month</span>
              </div>
            </div>
          </div>

          {/* Stripe Checkout Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={proceedToCheckout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blurple-500 hover:bg-blurple-600 text-white font-semibold py-3.5 transition disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 anim-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {loading ? 'Connecting to Stripe...' : 'Proceed to Secure Checkout'}
            </button>
          </div>

          {/* Security & Buyer Protection Footer */}
          <div className="pt-2 border-t border-brand-200 flex items-center justify-between text-[11px] text-brand-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>256-Bit SSL Encrypted & Secured by Stripe</span>
            </div>
            <button
              type="button"
              onClick={() => setCheckoutModalOpen(false)}
              className="text-brand-500 hover:text-brand-900 transition"
            >
              Cancel
            </button>
          </div>

        </div>
      </Modal>

      {/* Multi-Tenant Security & Infrastructure */}
      <Panel className="flex items-start gap-4 p-5 border border-brand-200 bg-brand-50">
        <span className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-brand-900">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-brand-900">Multi-Tenant Isolation & Proxy Infrastructure</h3>
          <p className="text-xs leading-relaxed text-brand-500">
            Every custom bot slot runs in an isolated worker sandbox with its own memory allocations and pathfinder instances.
            Paid and Custom tier accounts dial private SOCKS5 proxies per-bot with automatic fallback and anti-freeze detection.
          </p>
        </div>
      </Panel>
    </div>
  );
}
