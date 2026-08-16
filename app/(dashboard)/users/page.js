'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Plus, Shield, Sparkles, Trash2, UserCog, Users, Zap } from 'lucide-react';
import { useAuth, useToast } from '@/components/providers';
import { Button, Checkbox, EmptyState, Modal, PageHeader, Panel, StatusBadge, Skeleton, Select } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free Starter ($0 - 1 Bot)' },
  { value: 'bronze_3', label: 'Bronze Pro ($2 - 3 Bots)' },
  { value: 'silver_5', label: 'Silver Pro ($5 - 10 Bots)' },
  { value: 'unlimited_15', label: 'Unlimited Pro ($12 - ∞ Bots)' },
  { value: 'custom', label: 'Custom Fleet ($0.50/bot + $0.50/proxy)' },
];

const blankUser = { email: '', password: '', role: 'user', tier: 'free', allBots: false };

export default function UsersPage() {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankUser);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (me.role !== 'admin') return;
    setLoading(true);
    try {
      const result = await api('/users');
      setUsers(result.users || []);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [me.role, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const open = (account = null) => {
    setEditing(account);
    setForm(
      account
        ? {
            email: account.email,
            password: '',
            role: account.role,
            tier: account.tier || 'free',
            allBots: !!account.permissions?.allBots,
          }
        : blankUser
    );
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        email: form.email.trim(),
        role: form.role,
        tier: form.tier,
        permissions: {
          allBots: form.allBots,
          botIds: editing?.permissions?.botIds || [],
          categories: editing?.permissions?.categories || [],
        },
      };
      if (form.password) body.password = form.password;
      await api(editing ? `/users/${editing.id}` : '/users', {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      toast(editing ? 'User updated' : 'User created', 'success');
      setModalOpen(false);
      await load();
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (account) => {
    if (!window.confirm(`Delete ${account.email}? Their bots and proxies must be reassigned first.`)) return;
    try {
      await api(`/users/${account.id}`, { method: 'DELETE' });
      toast('User deleted', 'success');
      await load();
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  if (me.role !== 'admin') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <PageHeader eyebrow="Administration" title="Users" description="Account administration is restricted to panel administrators." />
        <Panel className="p-8 border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)]">
          <EmptyState icon={Shield} title="Administrator access required" description="Your account can manage its own resources, aliases, scripts, schedules, and preferences." />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        eyebrow="Administration"
        title="Users & Subscriptions"
        description="Manage tenant accounts, view running bot counts, and override subscription plans."
        actions={
          <Button size="sm" variant="primary" onClick={() => open()}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New user
          </Button>
        }
      />

      {loading ? (
        <Panel className="p-6 space-y-4 border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)]">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Panel>
      ) : users.length ? (
        <Panel className="overflow-hidden border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-rule bg-paper-2 text-ink-soft lp-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Subscription Plan</th>
                  <th className="px-4 py-3">Bots (Running / Total)</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Last Login</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-mono">
                {users.map((account) => {
                  const tier = account.tier || 'free';
                  return (
                    <tr key={account.id} className="hover:bg-paper-2 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center border border-ink bg-paper-2 text-xs font-bold uppercase text-ink shadow-[1px_1px_0_#111111]">
                            {account.email.slice(0, 2)}
                          </span>
                          <div>
                            <strong className="block text-xs font-bold text-ink">{account.email}</strong>
                            <span className="font-mono text-[10px] text-ink-faint">{account.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={account.role === 'admin' ? 'running_job' : 'stopped'} />
                          <span className="text-xs capitalize font-bold text-ink">{account.role}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 border px-2.5 py-0.5 text-[10px] font-bold ${
                            tier === 'unlimited_15'
                              ? 'border-ember/40 bg-ember/10 text-ember'
                              : tier === 'silver_5'
                              ? 'border-ink bg-paper text-ink'
                              : tier === 'bronze_3'
                              ? 'border-amber-500/40 bg-amber-500/10 text-amber-700'
                              : 'border-rule bg-paper-2 text-ink-soft'
                          }`}
                        >
                          <Zap className="h-3 w-3" />
                          {tier === 'unlimited_15'
                            ? 'Unlimited ($12)'
                            : tier === 'silver_5'
                            ? 'Silver ($5)'
                            : tier === 'bronze_3'
                            ? 'Bronze ($2)'
                            : tier === 'custom'
                            ? 'Custom Fleet'
                            : 'Free Starter ($0)'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink font-mono">
                        <span className="font-bold text-jade">{account.runningBots || 0}</span> running / {account.totalBots || 0} total
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-soft">{formatDate(account.createdAt, { dateOnly: true })}</td>
                      <td className="px-4 py-3 text-xs text-ink-soft">{formatDate(account.lastLoginAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => open(account)}>
                            <UserCog className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="danger" disabled={account.id === me.id} onClick={() => remove(account)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
        !loading && (
          <Panel className="p-8 border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)]">
            <EmptyState
              icon={Users}
              title="No users found"
              description="Create the first tenant account for this service."
              action={
                <Button variant="primary" onClick={() => open()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create user
                </Button>
              }
            />
          </Panel>
        )
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit user' : 'Create user'}
        description="Configure tenant permissions and assign subscription plan tier."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save} loading={saving} disabled={!form.email.trim() || (!editing && form.password.length < 6)}>
              {editing ? 'Save changes' : 'Create user'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <label className="block">
            <span className="block lp-mono text-[10px] text-ink-soft uppercase mb-1">Username or email</span>
            <input
              className="w-full border border-ink bg-white px-3 py-2 text-xs font-mono text-ink placeholder-ink-faint focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="tenant@example.com"
            />
          </label>
          <label className="block">
            <span className="block lp-mono text-[10px] text-ink-soft uppercase mb-1">{editing ? 'New password' : 'Password'}</span>
            <span className="relative block">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="password"
                className="w-full border border-ink bg-white pl-10 pr-3 py-2 text-xs font-mono text-ink placeholder-ink-faint focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder={editing ? 'Leave blank to keep current' : 'At least 6 characters'}
              />
            </span>
          </label>
          <label className="block">
            <span className="block lp-mono text-[10px] text-ink-soft uppercase mb-1">Subscription Plan Tier</span>
            <Select
              value={form.tier}
              onChange={(value) => setForm({ ...form, tier: value })}
              options={PLAN_OPTIONS}
            />
          </label>
          <label className="block">
            <span className="block lp-mono text-[10px] text-ink-soft uppercase mb-1">Role</span>
            <Select
              value={form.role}
              onChange={(value) => setForm({ ...form, role: value })}
              options={[
                { value: 'user', label: 'User (Tenant)' },
                { value: 'admin', label: 'Administrator' },
              ]}
            />
          </label>
          <Checkbox checked={form.allBots} onChange={(checked) => setForm({ ...form, allBots: checked })} label="Manage every bot" description="Grant visibility and lifecycle control for all tenants' bots." />
        </div>
      </Modal>
    </div>
  );
}
