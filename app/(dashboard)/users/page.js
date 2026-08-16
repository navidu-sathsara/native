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
      <div className="space-y-6">
        <PageHeader eyebrow="Administration" title="Users" description="Account administration is restricted to panel administrators." />
        <Panel>
          <EmptyState icon={Shield} title="Administrator access required" description="Your account can manage its own resources, aliases, scripts, schedules, and preferences." />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Users & Subscriptions"
        description="Manage tenant accounts, view running bot counts, and override subscription plans."
        actions={
          <Button size="sm" variant="primary" onClick={() => open()}>
            <Plus className="h-3.5 w-3.5" /> New user
          </Button>
        }
      />

      {loading ? (
        <Panel className="p-6 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Panel>
      ) : users.length ? (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Role</th>
                <th>Subscription Plan</th>
                <th>Bots (Running / Total)</th>
                <th>Created</th>
                <th>Last Login</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((account) => {
                const tier = account.tier || 'free';
                return (
                  <tr key={account.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-xs font-bold uppercase text-brand-900">
                          {account.email.slice(0, 2)}
                        </span>
                        <div>
                          <strong className="block text-sm text-brand-900">{account.email}</strong>
                          <span className="font-mono text-[10px] text-brand-600">{account.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={account.role === 'admin' ? 'running_job' : 'stopped'} />
                      <span className="ml-2 text-xs capitalize text-brand-600">{account.role}</span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          tier === 'unlimited_15'
                            ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                            : tier === 'silver_5'
                            ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                            : tier === 'bronze_3'
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            : 'bg-brand-50 border border-brand-200 text-brand-500'
                        }`}
                      >
                        <Zap className="h-3 w-3" />
                        {tier === 'unlimited_15'
                          ? 'Unlimited ($15)'
                          : tier === 'silver_5'
                          ? 'Silver ($5)'
                          : tier === 'bronze_3'
                          ? 'Bronze ($3)'
                          : 'Free Starter ($0)'}
                      </span>
                    </td>
                    <td className="text-xs text-brand-900">
                      <span className="font-medium text-emerald-400">{account.runningBots || 0}</span> running / {account.totalBots || 0} total
                    </td>
                    <td className="text-xs text-brand-500">{formatDate(account.createdAt, { dateOnly: true })}</td>
                    <td className="text-xs text-brand-500">{formatDate(account.lastLoginAt)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
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
      ) : (
        !loading && (
          <Panel>
            <EmptyState
              icon={Users}
              title="No users found"
              description="Create the first tenant account for this service."
              action={
                <Button variant="primary" onClick={() => open()}>
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
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save} loading={saving} disabled={!form.email.trim() || (!editing && form.password.length < 6)}>
              {editing ? 'Save changes' : 'Create user'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <label>
            <span className="field-label">Username or email</span>
            <input className="field-control" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="tenant@example.com" />
          </label>
          <label>
            <span className="field-label">{editing ? 'New password' : 'Password'}</span>
            <span className="relative block">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-600" />
              <input
                type="password"
                className="field-control pl-10"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder={editing ? 'Leave blank to keep current' : 'At least 6 characters'}
              />
            </span>
          </label>
          <label>
            <span className="field-label">Subscription Plan Tier</span>
            <Select
              value={form.tier}
              onChange={(value) => setForm({ ...form, tier: value })}
              options={PLAN_OPTIONS}
            />
          </label>
          <label>
            <span className="field-label">Role</span>
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
