'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, CircleStop, Clock3, Play, Plus, RefreshCw, Trash2, XCircle } from 'lucide-react';
import { useDashboard } from '@/components/dashboard-provider';
import { useToast } from '@/components/providers';
import { Button, Checkbox, EmptyState, Modal, PageHeader, Panel, StatCard, StatusBadge, Skeleton, Select } from '@/components/ui';
import { api } from '@/lib/api';
import { botLabel, formatDate, relativeTime } from '@/lib/format';

function defaultDateValue() {
  const date = new Date(Date.now() + 5 * 60000);
  date.setSeconds(0, 0);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function SchedulesPage() {
  const { bots } = useDashboard();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [action, setAction] = useState('start');
  const [runAt, setRunAt] = useState(defaultDateValue());
  const [timeZone, setTimeZone] = useState('local');
  const [botIds, setBotIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { const result = await api('/schedules'); setSchedules(result.schedules || []); }
    catch (error) { if (!quiet) toast(error.message, 'error'); } finally { if (!quiet) setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); const timer = window.setInterval(() => load(true), 4000); return () => window.clearInterval(timer); }, [load]);

  const counts = useMemo(() => ({
    pending: schedules.filter((item) => ['pending', 'running'].includes(item.status)).length,
    done: schedules.filter((item) => item.status === 'done').length,
    failed: schedules.filter((item) => ['failed', 'partial'].includes(item.status)).length,
  }), [schedules]);

  const open = () => {
    setAction('start'); setRunAt(defaultDateValue()); setTimeZone('local'); setBotIds(bots.map((bot) => bot.id)); setModalOpen(true);
  };
  const toggleBot = (id, checked) => setBotIds((current) => checked ? [...new Set([...current, id])] : current.filter((item) => item !== id));

  const create = async () => {
    if (!botIds.length) return;
    setSaving(true);
    try {
      const parsed = new Date(timeZone === 'UTC' ? `${runAt}Z` : runAt);
      if (Number.isNaN(parsed.getTime())) throw new Error('Choose a valid date and time');
      await api('/schedules', { method: 'POST', body: JSON.stringify({ action, botIds, runAt: parsed.toISOString(), timeZone }) });
      toast(`${action === 'start' ? 'Start' : 'Stop'} action scheduled`, 'success');
      setModalOpen(false);
      await load();
    } catch (error) { toast(error.message, 'error'); } finally { setSaving(false); }
  };

  const remove = async (schedule) => {
    const verb = schedule.status === 'pending' ? 'cancel' : 'remove';
    if (!window.confirm(`${verb === 'cancel' ? 'Cancel' : 'Remove'} this schedule?`)) return;
    try { await api(`/schedules/${encodeURIComponent(schedule.id)}`, { method: 'DELETE' }); toast(`Schedule ${verb}led`, 'success'); await load(); }
    catch (error) { toast(error.message, 'error'); }
  };

  const sorted = [...schedules].sort((a, b) => {
    const aPending = ['pending', 'running'].includes(a.status);
    const bPending = ['pending', 'running'].includes(b.status);
    if (aPending !== bPending) return aPending ? -1 : 1;
    return aPending ? new Date(a.runAt) - new Date(b.runAt) : new Date(b.runAt) - new Date(a.runAt);
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Automation" title="Schedules" description="Start or stop selected bots at an exact local or UTC time, even while the panel is closed." actions={<><Button size="sm" onClick={() => load()} loading={loading}><RefreshCw className="h-3.5 w-3.5" />Refresh</Button><Button size="sm" variant="primary" onClick={open}><Plus className="h-3.5 w-3.5" />New schedule</Button></>} />
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="All schedules" value={schedules.length} icon={CalendarClock} />
          <StatCard label="Upcoming" value={counts.pending} icon={Clock3} tone="blue" />
          <StatCard label="Completed" value={counts.done} icon={CheckCircle2} tone="green" />
          <StatCard label="Attention" value={counts.failed} icon={XCircle} tone={counts.failed ? 'red' : 'default'} />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : sorted.length ? (
        <div className="space-y-3">
          {sorted.map((schedule) => (
            <Panel key={schedule.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <span className={`rounded-lg border p-2.5 ${schedule.action === 'start' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' : 'border-red-500/25 bg-red-500/10 text-red-400'}`}>
                  {schedule.action === 'start' ? <Play className="h-4 w-4" /> : <CircleStop className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-brand-900">{schedule.action === 'start' ? 'Start bots' : 'Stop bots'}</h2>
                    <StatusBadge status={schedule.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-brand-500">
                    <span>{formatDate(schedule.runAt)}</span>
                    <span>{relativeTime(schedule.runAt)}</span>
                    <span>{schedule.timeZone === 'UTC' ? 'UTC input' : 'Local input'}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(schedule.botIds || []).slice(0, 10).map((id) => {
                      const bot = bots.find((item) => item.id === id);
                      return <span key={id} className="rounded-md border border-brand-200 bg-brand-50 px-2 py-1 text-[10px] text-brand-600">{bot ? botLabel(bot) : id}</span>;
                    })}
                    {(schedule.botIds || []).length > 10 && <span className="rounded-md bg-brand-100 px-2 py-1 text-[10px] text-brand-500">+{schedule.botIds.length - 10} more</span>}
                  </div>
                  {!['pending', 'running'].includes(schedule.status) && <p className="mt-3 text-xs text-brand-500">{schedule.ok || 0} completed · {schedule.skipped || 0} skipped · {schedule.failed || 0} failed</p>}
                </div>
                {schedule.status !== 'running' && (
                  <Button size="sm" variant={schedule.status === 'pending' ? 'danger' : 'ghost'} onClick={() => remove(schedule)}>
                    <Trash2 className="h-3.5 w-3.5" />{schedule.status === 'pending' ? 'Cancel' : 'Remove'}
                  </Button>
                )}
              </div>
            </Panel>
          ))}
        </div>
      ) : !loading && (
        <Panel>
          <EmptyState icon={CalendarClock} title="No schedules yet" description="Create a lifecycle schedule that runs independently of your browser session." action={<Button variant="primary" onClick={open}><Plus className="h-4 w-4" />New schedule</Button>} />
        </Panel>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Schedule bot action" description="This action runs on the server even if you sign out." wide footer={<><Button onClick={() => setModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={create} loading={saving} disabled={!botIds.length || !runAt}>Create schedule</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="field-label">Action</span>
            <Select
              value={action}
              onChange={setAction}
              options={[
                { value: 'start', label: 'Start bots' },
                { value: 'stop', label: 'Stop bots' }
              ]}
            />
          </label>
          <label>
            <span className="field-label">Time zone</span>
            <Select
              value={timeZone}
              onChange={setTimeZone}
              options={[
                { value: 'local', label: 'Local time' },
                { value: 'UTC', label: 'UTC / GMT' }
              ]}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="field-label">Date and time</span>
            <input type="datetime-local" className="field-control" value={runAt} onChange={(event) => setRunAt(event.target.value)} />
          </label>
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="field-label mb-0">Target bots</span>
              <button onClick={() => setBotIds(botIds.length === bots.length ? [] : bots.map((bot) => bot.id))} className="text-xs font-semibold text-brand-600">
                {botIds.length === bots.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            {bots.length ? (
              <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
                {bots.map((bot) => <Checkbox key={bot.id} checked={botIds.includes(bot.id)} onChange={(checked) => toggleBot(bot.id, checked)} label={botLabel(bot)} description={`${bot.id} · ${bot.status || 'stopped'}`} />)}
              </div>
            ) : (
              <p className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-500">No bots are available to schedule.</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
