'use client';

import { useEffect, useState } from 'react';
import {
  KeyRound, Save, Settings, ShieldCheck, UserRound, Sparkles,
  Zap, Clock, Palette, Sliders, Trash2, RefreshCw, CheckCircle2
} from 'lucide-react';
import { useAuth, useToast } from '@/components/providers';
import { Button, Checkbox, PageHeader, Panel, Select, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

export default function SettingsPage() {
  const { user, setUser, refresh } = useAuth();
  const { toast } = useToast();
  const [account, setAccount] = useState({ email: user?.email || '', password: '', confirm: '' });
  const [preferences, setPreferences] = useState(user?.preferences || {});
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    if (user) {
      setAccount((current) => ({ ...current, email: user.email }));
      setPreferences(user.preferences || {});
    }
  }, [user]);

  const saveAccount = async (event) => {
    event.preventDefault();
    if (account.password && account.password !== account.confirm) {
      return toast('Passwords do not match', 'error');
    }
    setSavingAccount(true);
    try {
      const body = { email: account.email.trim() };
      if (account.password) body.password = account.password;
      await api('/account', { method: 'PATCH', body: JSON.stringify(body) });
      const updated = await refresh();
      if (updated) setUser(updated);
      setAccount((current) => ({ ...current, password: '', confirm: '' }));
      toast('Account details saved successfully', 'success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setSavingAccount(false);
    }
  };

  const savePreferences = async (event) => {
    event?.preventDefault?.();
    setSavingPreferences(true);
    try {
      const result = await api('/preferences', { method: 'PATCH', body: JSON.stringify(preferences) });
      setPreferences(result.preferences);
      setUser({ ...user, preferences: result.preferences });
      toast('Preferences saved and applied', 'success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setSavingPreferences(false);
    }
  };

  const changePreference = (key, value) => {
    setPreferences((current) => {
      const updated = { ...current, [key]: value };
      return updated;
    });
  };

  const clearLocalCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      toast('Client cache cleared. Reloading session...', 'info');
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      toast('Cache cleared', 'success');
    }
  };

  const currentTier = user?.preferences?.tier || 'free';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account Settings"
        title="Settings & Preferences"
        description="Manage your account profile, credentials, dashboard interface options, and workspace preferences."
      />

      {/* Account & Active Subscription Summary */}
      <Panel className="p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-brand-900">
              <UserRound className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-base font-semibold text-brand-900">{user?.email}</strong>
                <span className="rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-900">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-brand-500 mt-1 flex items-center gap-2">
                <span>Tenant ID: <code className="font-mono text-brand-500">{user?.id?.slice(0, 12)}</code></span>
                <span>·</span>
                <span>Member since {formatDate(user?.createdAt, { dateOnly: true })}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-right">
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-brand-500">Subscription Tier</span>
              <span className="font-semibold text-xs text-brand-900 capitalize flex items-center gap-1 justify-end mt-0.5">
                <Zap className="h-3 w-3" />
                {currentTier === 'unlimited_15'
                  ? 'Unlimited ($15)'
                  : currentTier === 'silver_5'
                  ? 'Silver Pro ($5)'
                  : currentTier === 'bronze_3'
                  ? 'Bronze Pro ($3)'
                  : 'Free Starter ($0)'}
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Account Profile & Security Panel */}
        <Panel className="p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 border-b border-brand-200 pb-4">
              <span className="rounded-xl border border-brand-200 bg-brand-50 p-2 text-brand-900">
                <KeyRound className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-semibold text-brand-900 text-base">Account Security</h2>
                <p className="text-xs text-brand-500">Update username, email, or change your workspace password</p>
              </div>
            </div>

            <form onSubmit={saveAccount} id="account-form" className="mt-5 space-y-4">
              <label className="block">
                <span className="field-label">Username or Email</span>
                <input
                  className="field-control"
                  value={account.email}
                  onChange={(event) => setAccount({ ...account, email: event.target.value })}
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="field-label">New Password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="field-control"
                    value={account.password}
                    onChange={(event) => setAccount({ ...account, password: event.target.value })}
                    placeholder="Leave blank to keep current"
                  />
                </label>

                <label className="block">
                  <span className="field-label">Confirm Password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="field-control"
                    value={account.confirm}
                    onChange={(event) => setAccount({ ...account, confirm: event.target.value })}
                    placeholder="Confirm new password"
                  />
                </label>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-between gap-3 pt-6 border-t border-brand-200 mt-6">
            <span className="text-xs text-brand-500 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />
              <span>Password encrypted via SHA-256 / scrypt</span>
            </span>
            <Button type="submit" form="account-form" variant="primary" loading={savingAccount}>
              <Save className="h-4 w-4 mr-1" /> Save Account
            </Button>
          </div>
        </Panel>

        {/* Interface Preferences Panel */}
        <Panel className="p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 border-b border-brand-200 pb-4">
              <span className="rounded-xl border border-brand-200 bg-brand-50 p-2 text-brand-900">
                <Sliders className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-semibold text-brand-900 text-base">Interface Preferences</h2>
                <p className="text-xs text-brand-500">Customize dashboard layout, density, and behavior</p>
              </div>
            </div>

            <form onSubmit={savePreferences} id="pref-form" className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="field-label">Layout Density</span>
                  <Select
                    value={preferences.density || 'comfortable'}
                    onChange={(value) => changePreference('density', value)}
                    options={[
                      { value: 'comfortable', label: 'Comfortable (Default)' },
                      { value: 'compact', label: 'Compact Table View' },
                    ]}
                  />
                </label>

                <label className="block">
                  <span className="field-label">Default Start Page</span>
                  <Select
                    value={preferences.startPage || 'overview'}
                    onChange={(value) => changePreference('startPage', value)}
                    options={[
                      { value: 'overview', label: 'Overview Dashboard' },
                      { value: 'bots', label: 'Bots Fleet' },
                      { value: 'proxies', label: 'Network Proxies' },
                      { value: 'commands', label: 'Command Aliases' },
                      { value: 'schedules', label: 'Automation Schedules' },
                      { value: 'billing', label: 'Subscription Billing' },
                    ]}
                  />
                </label>

                <label className="block">
                  <span className="field-label">Sidebar Behavior</span>
                  <Select
                    value={preferences.sidebar || 'expanded'}
                    onChange={(value) => changePreference('sidebar', value)}
                    options={[
                      { value: 'expanded', label: 'Expanded by default' },
                      { value: 'collapsed', label: 'Collapsed icon mode' },
                    ]}
                  />
                </label>

                <label className="block">
                  <span className="field-label">Timezone Display</span>
                  <input
                    className="field-control"
                    value={preferences.timezone || 'local'}
                    onChange={(event) => changePreference('timezone', event.target.value)}
                    placeholder="local, Asia/Colombo, UTC, America/New_York"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <Checkbox
                  checked={preferences.confirmDanger !== false}
                  onChange={(value) => changePreference('confirmDanger', value)}
                  label="Confirm destructive actions"
                  description="Require confirmation before terminating bots or removing endpoints."
                />
                <Checkbox
                  checked={preferences.autoRefresh !== false}
                  onChange={(value) => changePreference('autoRefresh', value)}
                  label="Auto-refresh streams"
                  description="Keep SSE telemetries and live job logs synced automatically."
                />
              </div>
            </form>
          </div>

          <div className="flex items-center justify-between gap-3 pt-6 border-t border-brand-200 mt-6">
            <Button type="button" variant="ghost" onClick={clearLocalCache} className="text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Clear Cache & Reload
            </Button>
            <Button type="submit" form="pref-form" variant="primary" loading={savingPreferences}>
              <Save className="h-4 w-4 mr-1" /> Save Preferences
            </Button>
          </div>
        </Panel>
      </div>

      {/* Isolation Info */}
      <Panel className="flex items-start gap-4 p-5">
        <span className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-brand-900">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-brand-900">Multi-Tenant Isolation & Sandbox Integrity</h2>
          <p className="mt-1 text-xs leading-relaxed text-brand-500">
            Your bots, proxies, command aliases, custom behavior scripts, cron schedules, preferences, and payment receipts are completely isolated in your private workspace directory.
          </p>
        </div>
      </Panel>
    </div>
  );
}
