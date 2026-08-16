'use client';

import { useCallback, useEffect, useState } from 'react';
import { Command, Pencil, Plus, RefreshCw, Send, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/providers';
import { Button, EmptyState, Modal, PageHeader, Panel } from '@/components/ui';

const blankAlias = { name: '', cmd: '', desc: '' };

export default function AliasesPage() {
  const { toast } = useToast();
  const [aliases, setAliases] = useState([]);
  const [syncedTo, setSyncedTo] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(blankAlias);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api('/custom-cmds');
      setAliases(result.cmds || []);
      setSyncedTo(result.syncedTo || 0);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const open = (alias = null) => {
    setEditing(alias);
    setModalOpen(true);
    setForm(alias ? { name: alias.name || '', cmd: alias.cmd || '', desc: alias.desc || '' } : blankAlias);
  };

  const save = async () => {
    if (!form.name.trim() || !form.cmd.trim()) return;
    setSaving(true);
    try {
      const path = editing ? `/custom-cmds/${encodeURIComponent(editing.id)}` : '/custom-cmds';
      await api(path, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(form) });
      toast(editing ? 'Alias updated' : 'Alias created', 'success');
      setEditing(null);
      setModalOpen(false);
      setForm(blankAlias);
      await load();
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (alias) => {
    if (!window.confirm(`Delete the alias ${alias.name}?`)) return;
    try {
      await api(`/custom-cmds/${encodeURIComponent(alias.id)}`, { method: 'DELETE' });
      toast('Alias deleted', 'success');
      await load();
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const result = await api('/custom-cmds/sync', { method: 'POST', body: '{}' });
      setSyncedTo(result.pushed || 0);
      toast(`Aliases synced to ${result.pushed || 0} running bots`, 'success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        eyebrow="Automation"
        title="Aliases"
        description="Private command shortcuts that sync only to bots owned by this account."
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={sync} loading={syncing}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Sync to {syncedTo} bots
            </Button>
            <Button size="sm" variant="primary" onClick={() => open()}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              New alias
            </Button>
          </>
        }
      />

      {aliases.length ? (
        <Panel className="overflow-hidden border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-rule bg-paper-2 text-ink-soft lp-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Alias</th>
                  <th className="px-4 py-3">Command</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-mono">
                {aliases.map((alias) => (
                  <tr key={alias.id} className="hover:bg-paper-2 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="border border-ink/20 bg-paper-2 p-1.5 text-ink">
                          <Command className="h-3.5 w-3.5" />
                        </span>
                        <strong className="text-xs font-bold text-ink">{alias.name}</strong>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="border border-rule bg-paper-2 px-2 py-1 text-xs text-ink font-mono">
                        {alias.cmd}
                      </code>
                    </td>
                    <td className="px-4 py-3 max-w-md text-xs text-ink-soft">
                      {alias.desc || 'No description'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => open(alias)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => remove(alias)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : !loading && (
        <Panel className="p-8 border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)]">
          <EmptyState
            icon={Command}
            title="No aliases yet"
            description="Create reusable names for commands you send often."
            action={
              <Button variant="primary" onClick={() => open()}>
                <Plus className="h-4 w-4 mr-1" />
                Create alias
              </Button>
            }
          />
        </Panel>
      )}

      <Panel className="flex items-start gap-4 p-5 border-ink/20 bg-white shadow-[3px_3px_0_rgba(17,17,17,0.06)]">
        <span className="border border-ink bg-paper-2 p-2.5 text-ember shadow-[1px_1px_0_#111111]">
          <Send className="h-5 w-5" />
        </span>
        <div>
          <h2 className="lp-display text-sm font-bold text-ink">Tenant isolation</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft font-mono">
            These aliases are stored in your account workspace. An administrator operating another tenant&apos;s bot cannot overwrite or receive them.
          </p>
        </div>
      </Panel>

      <Modal
        open={modalOpen}
        onClose={() => { setEditing(null); setModalOpen(false); setForm(blankAlias); }}
        title={editing ? 'Edit alias' : 'New alias'}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setEditing(null); setModalOpen(false); setForm(blankAlias); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} loading={saving} disabled={!form.name.trim() || !form.cmd.trim()}>
              {editing ? 'Save alias' : 'Create alias'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <label className="block">
            <span className="block lp-mono text-[10px] text-ink-soft uppercase mb-1">Alias name</span>
            <input
              className="w-full border border-ink bg-white px-3 py-2 text-xs font-mono text-ink placeholder-ink-faint focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="home"
            />
          </label>
          <label className="block">
            <span className="block lp-mono text-[10px] text-ink-soft uppercase mb-1">Command</span>
            <input
              className="w-full border border-ink bg-white px-3 py-2 text-xs font-mono text-ink placeholder-ink-faint focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
              value={form.cmd}
              onChange={(event) => setForm({ ...form, cmd: event.target.value })}
              placeholder="!home"
            />
          </label>
          <label className="block">
            <span className="block lp-mono text-[10px] text-ink-soft uppercase mb-1">Description</span>
            <textarea
              className="w-full border border-ink bg-white p-3 min-h-24 resize-y font-mono text-xs text-ink placeholder-ink-faint focus:border-ember focus:outline-none shadow-[2px_2px_0_#111111]"
              value={form.desc}
              onChange={(event) => setForm({ ...form, desc: event.target.value })}
              placeholder="Optional note for your team"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
