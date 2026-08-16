'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  CreditCard, ShieldCheck, Zap, Sparkles, CheckCircle2, Bot,
  Network, Lock, X, AlertCircle, Sliders, Layers, ArrowRight,
  Plus, Minus, RefreshCw, Check, Info, Server, Cpu, Shield,
  DollarSign, Globe, CheckCheck, Clock, Tag, Flame, Gamepad2
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

  // Active view tab: 'preset', 'custom', or 'promo'
  const [viewMode, setViewMode] = useState('preset');

  // Custom Plan Builder State
  const [customBots, setCustomBots] = useState(5);
  const [customProxies, setCustomProxies] = useState(2);

  // Promotional Plans State
  const [promoPlans, setPromoPlans] = useState([]);
  const [promoLoading, setPromoLoading] = useState(false);

  // Payment & Gateway Selection State
  const [activePlan, setActivePlan] = useState(user?.preferences?.tier || 'free');
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.preferences?.tier) {
      setActivePlan(user.preferences.tier);
    }
  }, [user]);

  // Load Active Promotional Plans
  const loadPromoPlans = useCallback(async () => {
    setPromoLoading(true);
    try {
      const res = await api('/plans/promo');
      if (res.ok && Array.isArray(res.plans)) {
        setPromoPlans(res.plans);
      }
    } catch (e) {
      // ignore
    } finally {
      setPromoLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromoPlans();
  }, [loadPromoPlans]);

  // Handle PayPal Return Callback
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paypalStatus = params.get('paypal_status');
    const token = params.get('token'); // PayPal Order ID
    const planId = params.get('plan_id');
    const amount = params.get('amount');
    const cancel = params.get('cancel');

    // 1. PayPal Approved Order Return
    if (token || paypalStatus === 'success') {
      setLoading(true);
      const verifyEndpoint = token ? '/billing/paypal-capture-order' : '/billing/paypal-verify';
      const verifyBody = token ? { orderId: token } : { plan_id: planId, amount };

      api(verifyEndpoint, {
        method: 'POST',
        body: JSON.stringify(verifyBody)
      })
      .then(res => {
        if (res.ok) {
          toast('🎉 PayPal Payment Verified! Your subscription and quotas are now active.', 'success');
          setUser(prev => ({
            ...prev,
            preferences: res.preferences || prev.preferences
          }));
          setActivePlan(res.tier);
        } else {
          toast(`PayPal verification failed: ${res.reason}`, 'error');
        }
      })
      .catch(err => {
        toast(`Verification error: ${err.message}`, 'error');
      })
      .finally(() => {
        setLoading(false);
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }

    if (cancel) {
      toast('Payment checkout was cancelled.', 'info');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setUser, toast]);

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

  // Proceed to PayPal Checkout
  const proceedToCheckout = async () => {
    if (!selectedPlanForPayment) return;
    setLoading(true);
    try {
      const payload = {
        planId: selectedPlanForPayment.id,
        customLimits: selectedPlanForPayment.isCustom ? selectedPlanForPayment.customLimits : undefined,
        returnUrl: window.location.origin,
      };

      const res = await api('/billing/paypal-create-order', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok && res.url) {
        window.location.href = res.url;
      } else {
        toast(res.reason || 'Failed to initialize PayPal checkout', 'error');
        setLoading(false);
      }
    } catch (err) {
      toast(err.message || 'PayPal connection failed', 'error');
      setLoading(false);
    }
  };

  // Change subscription locally for Free plan
  const downgradeToFree = async () => {
    setLoading(true);
    try {
      await api('/preferences', {
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

  // Open checkout modal for promotional plan
  const initiatePromoPayment = (plan) => {
    setSelectedPlanForPayment({
      id: plan.id,
      name: plan.name,
      price: `$${Number(plan.price).toFixed(2)}`,
      amount: plan.price,
      limit: plan.maxBots,
      proxiesLimit: plan.maxProxies,
      isCustom: false,
      isPromo: true,
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
    ? (customLimits?.promoPlanName || `Custom (${customLimits?.maxBots || 1} Bots${customLimits?.maxProxies ? `, ${customLimits.maxProxies} Proxies` : ''})`)
    : PRESET_PLANS.find((p) => p.id === userTier)?.name || 'Free Starter';

  const currentBotLimit = userTier === 'custom'
    ? (customLimits?.maxBots || 1)
    : (PRESET_PLANS.find((p) => p.id === userTier)?.limit || 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        eyebrow="Fleet Scalability & Multi-Gateway Billing"
        title="Plans & Billing"
        description="Choose a preset package, grab a limited-time deal, or scale dynamically with $0.50/bot and $0.50/proxy pricing."
        actions={
          <div className="flex border border-ink bg-paper-2 p-0.5">
            <button
              onClick={() => setViewMode('preset')}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase transition cursor-pointer ${
                viewMode === 'preset'
                  ? 'border border-ink bg-white text-ink shadow-[1px_1px_0_#111111]'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Standard Plans
            </button>
            {promoPlans.length > 0 && (
              <button
                onClick={() => setViewMode('promo')}
                className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase transition cursor-pointer ${
                  viewMode === 'promo'
                    ? 'border border-ember bg-ember text-white shadow-[1px_1px_0_#111111]'
                    : 'text-ember hover:bg-ember/10 font-bold'
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                Limited Deals ({promoPlans.length})
              </button>
            )}
            <button
              onClick={() => setViewMode('custom')}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase transition cursor-pointer ${
                viewMode === 'custom'
                  ? 'border border-ink bg-white text-ink shadow-[1px_1px_0_#111111]'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              Custom Fleet Builder
            </button>
          </div>
        }
      />

      {/* Subscription Status Banner */}
      <Panel className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)]">
        <div className="flex items-center gap-4">
          <span className="border border-ink bg-paper-2 p-3.5 text-ink shadow-[2px_2px_0_#111111]">
            <CreditCard className="h-6 w-6 text-ember" />
          </span>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="lp-display text-lg font-bold text-ink tracking-tight">{currentPlanTitle}</h2>
              <span className="border border-jade/40 bg-jade/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-jade">
                Active Tier
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-1 flex items-center gap-3 font-mono">
              <span>
                Bot capacity: <strong className="text-ink">{currentBotLimit === 9999 ? 'Unlimited (∞)' : `${currentBotLimit} bot(s)`}</strong>
              </span>
              {customLimits?.maxProxies > 0 && (
                <span>
                  • Dedicated proxies: <strong className="text-ink">{customLimits.maxProxies}</strong>
                </span>
              )}
              {user?.preferences?.lastPayment?.paidAt && (
                <span className="text-ink-soft hidden sm:inline">
                  • Renewed: {new Date(user.preferences.lastPayment.paidAt).toLocaleDateString()} ({user.preferences.lastPayment.gateway || 'Stripe'})
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right sm:block hidden border-r border-rule pr-4">
            <span className="block lp-mono text-[10px] text-ink-faint">Tenant ID</span>
            <span className="font-mono text-xs text-ink-soft">#{user?.id?.slice(0, 8) || 'local'}</span>
          </div>
          {userTier !== 'free' && (
            <Button
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={downgradeToFree}
              className="text-xs text-ember hover:bg-ember/10"
            >
              Downgrade to Free
            </Button>
          )}
        </div>
      </Panel>

      {/* ========================================================================= */}
      {/* ⚡ VIEW 0: LIMITED-TIME PROMOTIONAL DEALS                                  */}
      {/* ========================================================================= */}
      {viewMode === 'promo' && (
        <div className="space-y-6">
          <div className="border border-ember bg-white p-6 shadow-[4px_4px_0_#ff4400]">
            <div className="flex items-center gap-2.5">
              <span className="border border-ember bg-ember p-1.5 text-white">
                <Flame className="h-5 w-5 animate-pulse" />
              </span>
              <div>
                <h3 className="lp-display text-lg font-bold text-ink">Exclusive Limited-Time Flash Deals</h3>
                <p className="text-xs text-ink-soft font-mono mt-0.5">
                  Grab high-capacity bot and proxy packages at special promotional discounts before the timer runs out!
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {promoPlans.map((plan) => {
              const isCurrent = userTier === 'custom' && customLimits?.promoPlanId === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between p-7 transition-all duration-150 font-mono ${
                    plan.highlight
                      ? 'border-2 border-ember bg-white shadow-[6px_6px_0_#ff4400] z-10'
                      : 'border border-ink bg-white shadow-[4px_4px_0_#111111]'
                  }`}
                >
                  {/* Badge & Timer Header */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-rule">
                      <span className="border border-ember bg-ember text-white px-2.5 py-1 text-[10px] lp-mono font-bold">
                        {plan.badge}
                      </span>
                      {plan.expiresAt && (
                        <div className="flex items-center gap-1.5 text-[10px] text-ember font-bold">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Ends {new Date(plan.expiresAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Plan Name & Price */}
                    <div className="mt-4">
                      <h3 className="lp-display text-2xl font-bold text-ink tracking-tight">{plan.name}</h3>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="lp-display text-5xl font-bold text-ink">${Number(plan.price).toFixed(2)}</span>
                        <span className="text-xs text-ink-soft">{plan.period || '/ month'}</span>
                      </div>
                    </div>

                    {/* Quota Specs */}
                    <div className="mt-5 grid grid-cols-2 gap-2 border border-rule bg-paper-2 p-3 text-xs">
                      <div>
                        <span className="block lp-mono text-[9px] text-ink-faint">Bot Capacity</span>
                        <strong className="text-ink text-sm font-bold">{plan.maxBots === 9999 ? 'Unlimited' : `${plan.maxBots} Bots`}</strong>
                      </div>
                      <div>
                        <span className="block lp-mono text-[9px] text-ink-faint">Dedicated Proxies</span>
                        <strong className="text-ink text-sm font-bold">{plan.maxProxies} Proxies</strong>
                      </div>
                    </div>

                    {/* Features list */}
                    {plan.features && plan.features.length > 0 && (
                      <ul className="mt-6 space-y-2.5 text-xs">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-jade shrink-0 mt-0.5" />
                            <span className="text-ink-soft leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Checkout Button */}
                  <div className="mt-8 pt-4 border-t border-rule">
                    <Button
                      variant={plan.highlight ? 'primary' : 'secondary'}
                      className="w-full"
                      disabled={loading}
                      onClick={() => initiatePromoPayment(plan)}
                    >
                      {isCurrent ? `Renew Promo ($${Number(plan.price).toFixed(2)})` : `Claim / Switch Deal ($${Number(plan.price).toFixed(2)})`}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛠️ VIEW 1: CUSTOM PLAN BUILDER                                            */}
      {/* ========================================================================= */}
      {viewMode === 'custom' && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Controls Box (8 cols) */}
          <Panel className="p-7 lg:col-span-8 space-y-8 border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="border border-ink bg-paper-2 p-1.5 text-ink shadow-[1px_1px_0_#111111]">
                  <Sliders className="h-4 w-4 text-ember" />
                </span>
                <h3 className="lp-display text-base font-bold text-ink tracking-tight">Custom Fleet Configurator</h3>
              </div>
              <p className="text-xs text-ink-soft mt-1.5">
                Scale your fleet precisely. Pay only for the exact bot slots and dedicated proxies you need.
              </p>
            </div>

            {/* Slider 1: Bots Configuration */}
            <div className="border border-rule bg-paper-2 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bot className="h-4 w-4 text-ember" />
                  <div>
                    <h4 className="lp-display text-sm font-bold text-ink">Minecraft Bot Capacity</h4>
                    <p className="text-[11px] text-ink-soft font-mono">$0.50 / bot per month</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-ink bg-white p-1 shadow-[1px_1px_0_#111111]">
                    <button
                      type="button"
                      onClick={() => setCustomBots(Math.max(1, customBots - 1))}
                      className="p-1 text-ink-soft hover:text-ink cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-10 text-center font-mono text-sm font-bold text-ink">
                      {customBots}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomBots(Math.min(100, customBots + 1))}
                      className="p-1 text-ink-soft hover:text-ink cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-mono font-bold text-ink min-w-16 text-right">
                    ${(customBots * BOT_UNIT_PRICE).toFixed(2)}/mo
                  </span>
                </div>
              </div>

              {/* Bot Range Slider */}
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={customBots}
                onChange={(e) => setCustomBots(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-rule appearance-none cursor-pointer accent-[#ff4400]"
              />

              {/* Quick bot chips */}
              <div className="flex flex-wrap gap-2 pt-1 font-mono">
                {[1, 3, 5, 10, 20, 30, 50].map((b) => (
                  <button
                    key={b}
                    onClick={() => setCustomBots(b)}
                    className={`border px-2.5 py-1 text-[11px] transition cursor-pointer ${
                      customBots === b
                        ? 'border-ink bg-white text-ink font-bold shadow-[2px_2px_0_#111111]'
                        : 'border-rule bg-white/70 text-ink-soft hover:border-ink hover:text-ink'
                    }`}
                  >
                    {b} {b === 1 ? 'Bot' : 'Bots'} (${(b * BOT_UNIT_PRICE).toFixed(2)})
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 2: Dedicated Premium Proxies Configuration */}
            <div className="border border-rule bg-paper-2 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Network className="h-4 w-4 text-jade" />
                  <div>
                    <h4 className="lp-display text-sm font-bold text-ink">Dedicated Premium SOCKS5 Proxies</h4>
                    <p className="text-[11px] text-ink-soft font-mono">$0.50 / proxy per month (or bring your own)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-ink bg-white p-1 shadow-[1px_1px_0_#111111]">
                    <button
                      type="button"
                      onClick={() => setCustomProxies(Math.max(0, customProxies - 1))}
                      className="p-1 text-ink-soft hover:text-ink cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-10 text-center font-mono text-sm font-bold text-ink">
                      {customProxies}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomProxies(Math.min(30, customProxies + 1))}
                      className="p-1 text-ink-soft hover:text-ink cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-mono font-bold text-ink min-w-16 text-right">
                    ${(customProxies * PROXY_UNIT_PRICE).toFixed(2)}/mo
                  </span>
                </div>
              </div>

              {/* Proxy Range Slider */}
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={customProxies}
                onChange={(e) => setCustomProxies(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-rule appearance-none cursor-pointer accent-[#ff4400]"
              />

              {/* Quick proxy chips */}
              <div className="flex flex-wrap gap-2 pt-1 font-mono">
                {[0, 1, 2, 5, 10, 15, 20].map((p) => (
                  <button
                    key={p}
                    onClick={() => setCustomProxies(p)}
                    className={`border px-2.5 py-1 text-[11px] transition cursor-pointer ${
                      customProxies === p
                        ? 'border-ink bg-white text-ink font-bold shadow-[2px_2px_0_#111111]'
                        : 'border-rule bg-white/70 text-ink-soft hover:border-ink hover:text-ink'
                    }`}
                  >
                    {p === 0 ? '0 (Bring Own)' : `${p} Proxies ($${(p * PROXY_UNIT_PRICE).toFixed(2)})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Included Platform Perks */}
            <div className="pt-2 border-t border-rule grid sm:grid-cols-2 gap-3 text-xs text-ink-soft font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-jade shrink-0" />
                <span>Private SOCKS5 Proxy Dialing unlocked</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-jade shrink-0" />
                <span>Live Real-Time SSE Log & Inventory streaming</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-jade shrink-0" />
                <span>All Mining, PvP & Auto-Farm modules enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-jade shrink-0" />
                <span>Hot-reloading Visual Scripts & Cron Schedules</span>
              </div>
            </div>
          </Panel>

          {/* Right Column: Pricing Summary & Instant Checkout */}
          <Panel className="p-7 lg:col-span-4 flex flex-col justify-between border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)] relative overflow-hidden">
            <div className="space-y-6">
              <div>
                <span className="inline-block border border-ink bg-paper-2 px-3 py-1 lp-mono text-[10px] text-ink">
                  Order Summary
                </span>
                <h3 className="lp-display text-xl font-bold text-ink mt-3">Calculated Price</h3>
                <p className="text-xs text-ink-soft mt-1 font-mono">Instant provisioning upon checkout</p>
              </div>

              {/* Cost breakdown */}
              <div className="space-y-3 border border-rule bg-paper-2 p-4 text-xs font-mono">
                <div className="flex items-center justify-between text-ink-soft">
                  <span>{customCalculation.botsCount} × Bot Slots ($0.50)</span>
                  <span className="font-mono font-bold text-ink">${customCalculation.botsTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-ink-soft">
                  <span>{customCalculation.proxiesCount} × Proxies ($0.50)</span>
                  <span className="font-mono font-bold text-ink">${customCalculation.proxiesTotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-rule pt-3 flex items-baseline justify-between">
                  <span className="font-bold text-ink">Total Monthly</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-ink tracking-tight font-mono">
                      ${customCalculation.totalPrice.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-ink-soft ml-1">/ mo</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-[11px] text-ink-soft font-mono">
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-jade" />
                  <span>Cancel or adjust capacity anytime with zero lock-in</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-ink-soft" />
                  <span>PayPal & Card 256-bit SSL secured checkout</span>
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-rule">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={initiateCustomPayment}
              >
                <Zap className="h-4 w-4 mr-1.5" />
                Deploy Custom Fleet ({customCalculation.formattedPrice})
              </Button>
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📦 VIEW 2: PRESET PACKAGES                                                 */}
      {/* ========================================================================= */}
      {viewMode === 'preset' && (
        <div className="space-y-6">
          {/* Active Flash Deal Banner in Standard Plans */}
          {promoPlans.length > 0 && promoPlans[0] && (
            <div className="border-2 border-ember bg-white p-6 shadow-[5px_5px_0_#ff4400] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-mono">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="border border-ember bg-ember text-white px-2 py-0.5 text-[9px] font-bold uppercase">
                    {promoPlans[0].badge}
                  </span>
                  <span className="text-[11px] text-ember font-bold flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Special Promotional Deal
                  </span>
                </div>
                <h4 className="lp-display text-xl font-bold text-ink tracking-tight">
                  {promoPlans[0].name} ({promoPlans[0].maxBots} Bots + {promoPlans[0].maxProxies} Proxies)
                </h4>
                <p className="text-xs text-ink-soft">
                  Exclusive discount: Upgrade your fleet to {promoPlans[0].maxBots} bot slots for only ${Number(promoPlans[0].price).toFixed(2)}/mo.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => initiatePromoPayment(promoPlans[0])}
                className="shrink-0"
              >
                <Flame className="h-4 w-4 mr-1.5" />
                Claim Flash Offer (${Number(promoPlans[0].price).toFixed(2)})
              </Button>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PRESET_PLANS.map((plan) => {
            const isCurrent = userTier === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-7 transition-all duration-150 ${
                  plan.highlight
                    ? 'border-2 border-ember bg-white shadow-[4px_4px_0_#ff4400] z-10'
                    : 'border border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)] hover:border-ink'
                }`}
              >
                {/* Active Plan or Badge */}
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-rule">
                    <span
                      className={`inline-flex px-2.5 py-1 border text-[10px] lp-mono font-bold ${
                        isCurrent
                          ? 'border-jade bg-jade/10 text-jade'
                          : plan.highlight
                          ? 'border-ember bg-ember text-white shadow-[1px_1px_0_#111111]'
                          : 'border-rule bg-paper-2 text-ink-soft'
                      }`}
                    >
                      {isCurrent ? 'Current Plan' : plan.badge}
                    </span>
                    {plan.highlight && !isCurrent && (
                      <Sparkles className="h-5 w-5 text-ember" />
                    )}
                  </div>

                  <div className="mt-5">
                    <h3 className="lp-display text-xl font-bold text-ink">{plan.name}</h3>
                    
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="lp-display text-4xl font-bold tracking-tight text-ink">{plan.price}</span>
                      {plan.period && <span className="text-xs font-mono text-ink-soft">{plan.period}</span>}
                    </div>
                    
                    <p className="mt-3 text-xs text-ink-soft leading-relaxed min-h-[36px]">
                      {plan.description}
                    </p>

                    <ul className="mt-6 space-y-3 font-mono text-xs">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-ember' : 'text-jade'}`} />
                          <span className="text-ink-soft leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8">
                  {plan.id === 'free' ? (
                    <Button
                      variant={isCurrent ? 'ghost' : 'secondary'}
                      className="w-full"
                      disabled={isCurrent || loading}
                      onClick={downgradeToFree}
                    >
                      {isCurrent ? 'Active Plan (Free)' : 'Downgrade to Free ($0)'}
                    </Button>
                  ) : (
                    <Button
                      variant={plan.highlight ? 'primary' : 'secondary'}
                      className="w-full"
                      disabled={loading}
                      onClick={() => initiatePresetPayment(plan)}
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      {isCurrent
                        ? `Renew / Extend (${plan.price})`
                        : plan.id === 'unlimited_15'
                        ? `Upgrade to Unlimited (${plan.price})`
                        : `Switch / Upgrade (${plan.price})`}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* ── PAYPAL CHECKOUT MODAL ────────────────────────────────────── */}
      <Modal
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="Complete Subscription Upgrade"
        description="Checkout securely with PayPal or Credit/Debit Card"
      >
        <div className="space-y-5 py-2">
          
          {/* Itemized Order Summary Box */}
          <div className="border border-rule bg-paper-2 p-5 space-y-4 shadow-sm font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-rule">
              <div>
                <h4 className="text-sm font-bold text-ink">{selectedPlanForPayment?.name}</h4>
                <p className="text-xs text-ink-soft mt-0.5">
                  {selectedPlanForPayment?.isCustom
                    ? `${selectedPlanForPayment.limit} Bots + ${selectedPlanForPayment.proxiesLimit} Dedicated Proxies`
                    : `Capacity: ${selectedPlanForPayment?.limit === 9999 ? 'Unlimited' : selectedPlanForPayment?.limit} Bots`}
                </p>
              </div>
              <span className="border border-jade/40 bg-jade/10 text-jade text-[10px] px-2.5 py-1 font-bold">
                Instant Auto-Activation
              </span>
            </div>

            {/* Price Line */}
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs text-ink-soft">Total Amount Due</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-ink font-mono">
                  {selectedPlanForPayment?.price}
                </span>
                <span className="text-xs text-ink-soft ml-1">USD / month</span>
              </div>
            </div>
          </div>

          {/* PayPal Payment Method Details */}
          <div className="border-2 border-ember bg-white p-4 shadow-[3px_3px_0_#ff4400] font-mono space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-ember text-white px-2 py-0.5 text-[10px] font-bold">
                  PAYPAL SECURE
                </span>
                <span className="text-xs font-bold text-ink">PayPal Express & Card Checkout</span>
              </div>
              <Check className="h-4 w-4 text-jade" />
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              Pay using your <strong>PayPal Account Balance</strong> or use <strong>Debit / Credit Card (Visa, Mastercard, AMEX)</strong> via PayPal Guest Checkout.
            </p>
          </div>

          {/* Checkout Action Button */}
          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              onClick={proceedToCheckout}
              disabled={loading}
              className="w-full py-3 text-sm font-mono font-bold uppercase tracking-wider shadow-[3px_3px_0_#111111]"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {loading
                ? 'Opening PayPal Checkout...'
                : `Proceed to PayPal (${selectedPlanForPayment?.price})`}
            </Button>
          </div>

          {/* Security & Buyer Protection Footer */}
          <div className="pt-2 border-t border-rule flex items-center justify-between text-[11px] font-mono text-ink-soft">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-jade shrink-0" />
              <span>256-Bit SSL Encrypted & PayPal Buyer Protection</span>
            </div>
            <button
              type="button"
              onClick={() => setCheckoutModalOpen(false)}
              className="text-ink-soft hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Multi-Tenant Security & Infrastructure */}
      <Panel className="flex items-start gap-4 p-5 border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)]">
        <span className="border border-ink bg-paper-2 p-3 text-ink shadow-[1px_1px_0_#111111]">
          <ShieldCheck className="h-5 w-5 text-ember" />
        </span>
        <div className="space-y-1">
          <h3 className="lp-display text-sm font-bold text-ink">Multi-Tenant Isolation & Global Payments</h3>
          <p className="text-xs leading-relaxed text-ink-soft font-mono">
            Every custom bot slot runs in an isolated worker sandbox with its own memory allocations and pathfinder instances.
            Subscriptions support PayPal Express and Debit/Credit Cards with instant automated quota provisioning.
          </p>
        </div>
      </Panel>
    </div>
  );
}
