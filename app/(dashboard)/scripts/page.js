'use client';

import { useCallback, useEffect, useState } from 'react';
import { Braces, Clock3, FileCode2, Pencil, Plus, Trash2, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { useDashboard } from '@/components/dashboard-provider';
import { useToast } from '@/components/providers';
import { Button, Checkbox, EmptyState, Modal, PageHeader, Panel, StatusBadge, Tabs, Skeleton, Select } from '@/components/ui';

const blankScript = { name: '', type: 'interval', enabled: true, description: '', actionType: 'command', actionValue: '', interval: '30', pattern: '', matchType: 'contains', cooldown: '3', botIds: [] };

export default function ScriptsPage() {
  const { bots } = useDashboard();
  const { toast } = useToast();
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankScript);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const result = await api('/scripts'); setScripts(result.scripts || []); }
    catch (error) { toast(error.message, 'error'); } finally { setLoading(false); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const open = (script = null) => {
    setEditing(script);
    if (script) setForm({ name: script.name || '', type: script.type || 'interval', enabled: script.enabled !== false, description: script.description || '', actionType: script.action?.type || 'command', actionValue: script.action?.value || '', interval: String(Math.round((script.interval || 5000) / 1000)), pattern: script.trigger?.pattern || '', matchType: script.trigger?.matchType || 'contains', cooldown: String(Math.round((script.cooldown || 3000) / 1000)), botIds: script.botIds || [] });
    else setForm({ ...blankScript, botIds: [] });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = { name: form.name.trim(), type: form.type, enabled: form.enabled, description: form.description.trim(), action: { type: form.actionType, value: form.actionValue.trim() }, botIds: form.botIds };
      if (form.type === 'interval') body.interval = Math.max(1, Number(form.interval) || 30) * 1000;
      else { body.trigger = { pattern: form.pattern.trim(), matchType: form.matchType, ignoreCase: true, source: 'all' }; body.cooldown = Math.max(0, Number(form.cooldown) || 0) * 1000; }
      const path = editing ? `/scripts/${encodeURIComponent(editing.id)}` : '/scripts';
      await api(path, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      toast(editing ? 'Script saved' : 'Script created', 'success');
      setModalOpen(false);
      await load();
    } catch (error) { toast(error.message, 'error'); } finally { setSaving(false); }
  };

  const toggle = async (script) => {
    try { await api(`/scripts/${encodeURIComponent(script.id)}`, { method: 'PATCH', body: JSON.stringify({ enabled: script.enabled === false }) }); await load(); }
    catch (error) { toast(error.message, 'error'); }
  };

  const remove = async (script) => {
    if (!window.confirm(`Delete ${script.name} from the library and its target bots?`)) return;
    try { await api(`/scripts/${encodeURIComponent(script.id)}`, { method: 'DELETE' }); toast('Script deleted', 'success'); await load(); }
    catch (error) { toast(error.message, 'error'); }
  };

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleBot = (id, checked) => setForm((current) => ({ ...current, botIds: checked ? [...new Set([...current.botIds, id])] : current.botIds.filter((botId) => botId !== id) }));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Automation" title="Scripts" description="Reusable account automation deployed to selected bots, with interval and message-trigger modes." actions={<Button size="sm" variant="primary" onClick={() => open()}><Plus className="h-3.5 w-3.5" />New script</Button>} />
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Panel key={i} className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
              </div>
            </Panel>
          ))}
        </div>
      ) : scripts.length ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {scripts.map((script) => (
            <Panel key={script.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-lg border border-brand-200 bg-brand-50 p-2 text-brand-600">
                  {script.type === 'interval' ? <Clock3 className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                </span>
                <StatusBadge status={script.enabled === false ? 'stopped' : 'running'} />
              </div>
              <h2 className="mt-4 truncate font-semibold text-brand-900">{script.name}</h2>
              <p className="mt-1 min-h-10 text-sm leading-5 text-brand-500">{script.description || 'No description'}</p>
              <div className="mt-4 space-y-2 rounded-lg border border-brand-200 bg-brand-50 p-3 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-brand-600">Trigger</span>
                  <span className="text-right text-brand-900">
                    {script.type === 'interval' ? `Every ${Math.round((script.interval || 5000) / 1000)} seconds` : `${script.trigger?.matchType || 'contains'}: ${script.trigger?.pattern || ''}`}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-brand-600">Action</span>
                  <code className="max-w-[65%] truncate text-right text-brand-600">{script.action?.type === 'chat' ? 'chat' : 'command'}: {script.action?.value}</code>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-brand-600">Targets</span>
                  <span className="text-brand-900">{script.botIds?.length || 0} bot{script.botIds?.length === 1 ? '' : 's'}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1" variant={script.enabled === false ? 'success' : 'secondary'} onClick={() => toggle(script)}>
                  {script.enabled === false ? 'Enable' : 'Disable'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => open(script)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(script)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      ) : !loading && (
        <Panel>
          <EmptyState icon={Braces} title="No scripts yet" description="Create an interval or message-trigger script and deploy it to one or more of your bots." action={<Button variant="primary" onClick={() => open()}><Plus className="h-4 w-4" />Create script</Button>} />
        </Panel>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit script' : 'New script'} description="Scripts are private to your account." wide footer={<><Button onClick={() => setModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={save} loading={saving} disabled={!form.name.trim() || !form.actionValue.trim()}>Save script</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={form.name} onChange={(value) => setField('name', value)} placeholder="Auto home" />
          <label>
            <span className="field-label">Trigger type</span>
            <Select
              value={form.type}
              onChange={(value) => setField('type', value)}
              options={[
                { value: 'interval', label: 'Interval' },
                { value: 'message-trigger', label: 'Message trigger' }
              ]}
            />
          </label>
          <label>
            <span className="field-label">Action type</span>
            <Select
              value={form.actionType}
              onChange={(value) => setField('actionType', value)}
              options={[
                { value: 'command', label: 'Bot command' },
                { value: 'chat', label: 'Chat message' }
              ]}
            />
          </label>
          <Field label="Action value" value={form.actionValue} onChange={(value) => setField('actionValue', value)} placeholder="home or !say hello" />
          {form.type === 'interval' ? (
            <Field label="Interval (seconds)" type="number" value={form.interval} onChange={(value) => setField('interval', value)} />
          ) : (
            <>
              <Field label="Message pattern" value={form.pattern} onChange={(value) => setField('pattern', value)} placeholder="server restarting" />
              <label>
                <span className="field-label">Match mode</span>
                <Select
                  value={form.matchType}
                  onChange={(value) => setField('matchType', value)}
                  options={[
                    { value: 'contains', label: 'Contains' },
                    { value: 'exact', label: 'Exact' },
                    { value: 'regex', label: 'Regular expression' }
                  ]}
                />
              </label>
              <Field label="Cooldown (seconds)" type="number" value={form.cooldown} onChange={(value) => setField('cooldown', value)} />
            </>
          )}
          <label className="sm:col-span-2"><span className="field-label">Description</span><textarea className="field-control min-h-20 resize-y" value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Optional internal note" /></label>
          <div className="sm:col-span-2"><span className="field-label">Target bots</span>{bots.length ? <div className="grid gap-2 sm:grid-cols-2">{bots.map((bot) => <Checkbox key={bot.id} checked={form.botIds.includes(bot.id)} onChange={(checked) => toggleBot(bot.id, checked)} label={bot.config?.username || bot.id} description={`${bot.id} · ${bot.config?.category || 'Uncategorized'}`} />)}</div> : <p className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-500">Deploy a bot before assigning scripts.</p>}</div>
          <div className="sm:col-span-2"><Checkbox checked={form.enabled} onChange={(checked) => setField('enabled', checked)} label="Enabled" description="The script will be synced to its selected bot folders immediately." /></div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) { return <label><span className="field-label">{label}</span><input className="field-control" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>; }
