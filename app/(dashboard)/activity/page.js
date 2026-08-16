'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, Clock3, RefreshCw, Send, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Button, EmptyState, PageHeader, Panel, StatCard, StatusBadge, Skeleton } from '@/components/ui';
import { useToast } from '@/components/providers';

export default function ActivityPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const result = await api('/jobs');
      setJobs(result.jobs || []);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 4000);
    return () => window.clearInterval(timer);
  }, [load]);

  const counts = useMemo(() => ({
    running: jobs.filter((job) => job.status === 'running').length,
    complete: jobs.filter((job) => job.status === 'done' || job.status === 'completed').length,
    failed: jobs.filter((job) => ['failed', 'partial'].includes(job.status)).length,
  }), [jobs]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Automation" title="Activity" description="Persistent history for mass commands and background broadcast jobs." actions={<Button size="sm" onClick={() => load()} loading={loading}><RefreshCw className="h-3.5 w-3.5" />Refresh</Button>} />
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
          <StatCard label="All jobs" value={jobs.length} icon={Activity} />
          <StatCard label="Running" value={counts.running} icon={Clock3} tone="blue" />
          <StatCard label="Completed" value={counts.complete} icon={CheckCircle2} tone="green" />
          <StatCard label="Attention" value={counts.failed} icon={XCircle} tone={counts.failed ? 'red' : 'default'} />
        </div>
      )}

      <Panel className="overflow-hidden">
        <div className="border-b border-brand-200 px-5 py-4"><h2 className="font-semibold text-brand-900">Broadcast jobs</h2><p className="mt-0.5 text-xs text-brand-500">Jobs continue even after you close the browser.</p></div>
        {loading ? (
          <div className="p-5 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !jobs.length ? <EmptyState icon={Send} title="No activity yet" description="Broadcast a command from Overview or Bots and its execution will appear here." /> : (
          <div className="divide-y divide-slate-800/70">
            {jobs.map((job) => {
              const total = Number(job.total || 0);
              const done = Number(job.done || 0);
              const progress = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
              return (
                <article key={job.id} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0"><div className="flex items-center gap-2"><Send className="h-4 w-4 shrink-0 text-brand-600" /><code className="truncate text-sm font-semibold text-brand-900">{job.cmd}</code></div><p className="mt-2 text-xs text-brand-500">Created {formatDate(job.createdAt)} by {job.ownerLabel || 'workspace user'}</p></div>
                    <StatusBadge status={job.status === 'running' ? 'running_job' : job.status} />
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-brand-100"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} /></div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-brand-500"><span>{done}/{total} processed</span><span className="text-emerald-500">{job.ok || 0} successful</span><span>{job.skipped || 0} skipped</span><span>{job.staggerMs ? `${job.staggerMs}ms stagger` : 'No stagger'}</span></div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
