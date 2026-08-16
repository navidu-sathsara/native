'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  LayoutGrid, Bot, Play, CircleStop, Send, Sparkles, RefreshCw,
  Search, Shield, CheckSquare, Square, Globe, Cpu, ArrowUpRight,
  Terminal, CheckCircle2, AlertTriangle, Layers, Zap, Eraser,
  Columns2, Columns3, Columns4, Maximize2, X, Activity, MessageSquare
} from 'lucide-react';
import { useDashboard } from '@/components/dashboard-provider';
import { useAuth, useToast } from '@/components/providers';
import { Button, EmptyState, PageHeader, Panel, StatusBadge, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { botLabel, categoryOf } from '@/lib/format';

const MAX_LOGS = 600;

function normalizeLog(row) {
  if (typeof row === 'string') return { t: Date.now(), line: row };
  return { t: row?.t || Date.now(), line: String(row?.line ?? '') };
}

/* Colorized log styling based on message semantics */
function renderLine(line) {
  const lower = line.toLowerCase();
  if (/(error|failed|crash|kicked|fatal|exception)/.test(lower)) {
    return <span className="text-red-400 font-medium">{line}</span>;
  }
  if (/(warn|warning|stuck|retrying)/.test(lower)) {
    return <span className="text-amber-300 font-medium">{line}</span>;
  }
  if (/(spawned|connected|success|logged in|joined|ready)/.test(lower)) {
    return <span className="text-emerald-400 font-semibold">{line}</span>;
  }
  if (line.startsWith('[panel]') || line.startsWith('[system]')) {
    return <span className="text-cyan-400 font-medium">{line}</span>;
  }
  if (line.startsWith('[script]')) {
    return <span className="text-purple-300">{line}</span>;
  }
  if (line.startsWith('[chat]') || line.startsWith('<')) {
    return <span className="text-brand-900 font-mono">{line}</span>;
  }
  return <span className="text-brand-500">{line}</span>;
}

/**
 * Single Live Terminal Console Card for Multi-Bot Matrix
 */
function BotTerminalTile({
  bot,
  isSelected,
  onToggleSelect,
  onRefreshList,
  onFocus
}) {
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [sending, setSending] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [streamState, setStreamState] = useState('idle');
  const scrollRef = useRef(null);
  const { toast } = useToast();

  const isRunning = bot.status === 'running';

  // 1. Fetch initial snapshot
  const fetchSnapshot = useCallback(async () => {
    if (!bot?.id) return;
    try {
      const res = await api(`/bots/${encodeURIComponent(bot.id)}`);
      if (res.logs && Array.isArray(res.logs)) {
        setLogs(res.logs.slice(-MAX_LOGS).map(normalizeLog));
      }
    } catch (_) {
      /* ignore */
    }
  }, [bot?.id]);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  // 2. Real-time EventSource Stream + Periodic Heartbeat (for running bots)
  useEffect(() => {
    if (!bot?.id) return;

    let stream;
    if (isRunning) {
      try {
        stream = new EventSource(`/api/bots/${encodeURIComponent(bot.id)}/events`);
        stream.onopen = () => setStreamState('live');
        stream.onerror = () => setStreamState('syncing');
        stream.onmessage = (event) => {
          let payload;
          try { payload = JSON.parse(event.data); } catch { return; }
          if (payload.type === 'snapshot') {
            setLogs((payload.logs || []).slice(-MAX_LOGS).map(normalizeLog));
          }
          if (payload.type === 'log') {
            setLogs((current) => [...current, normalizeLog(payload)].slice(-MAX_LOGS));
          }
        };
      } catch (_) {
        setStreamState('polling');
      }
    } else {
      setStreamState('offline');
    }

    // Background polling fallback every 3 seconds
    const pollTimer = setInterval(() => {
      if (isRunning) fetchSnapshot();
    }, 3000);

    return () => {
      if (stream) stream.close();
      clearInterval(pollTimer);
    };
  }, [bot?.id, isRunning, fetchSnapshot]);

  // Auto-scroll on logs update
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  // Send single command
  const sendCmd = async (cmdText) => {
    const val = (cmdText || command).trim();
    if (!val || !bot?.id) return;
    setSending(true);
    try {
      await api(`/bots/${encodeURIComponent(bot.id)}/cmd`, {
        method: 'POST',
        body: JSON.stringify({ cmd: val }),
      });
      setCommand('');
      setLogs((prev) => [...prev, { t: Date.now(), line: `> ${val}` }]);
      setTimeout(fetchSnapshot, 300);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  // Single bot lifecycle (start/stop)
  const handleLifecycle = async (action) => {
    setBusyAction(true);
    try {
      await api(`/bots/${encodeURIComponent(bot.id)}/${action}`, { method: 'POST' });
      toast(`${botLabel(bot)} ${action === 'start' ? 'started' : 'stopped'}`, 'success');
      setTimeout(onRefreshList, action === 'start' ? 600 : 1500);
      setTimeout(fetchSnapshot, 1000);
    } catch (err) {
      toast(err.message || 'Action failed', 'error');
    } finally {
      setBusyAction(false);
    }
  };

  const shardCount = typeof bot.shards === 'number' ? bot.shards : null;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 flex flex-col bg-[#070707] overflow-hidden shadow-2xl ${
        isSelected
          ? 'border-brand-200 ring-1 ring-white/30'
          : 'border-brand-200 hover:border-brand-200'
      }`}
    >
      {/* Console Card Header */}
      <div className="flex h-11 items-center justify-between border-b border-brand-200 bg-brand-50/70 px-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => onToggleSelect(bot.id)}
            className="text-brand-500 hover:text-brand-900 transition p-0.5"
            title={isSelected ? 'Deselect bot' : 'Select bot'}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-brand-900" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>

          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              isRunning
                ? 'bg-emerald-400 shadow-sm animate-pulse'
                : 'bg-brand-50'
            }`}
          />

          <span className="truncate font-mono text-xs font-bold text-brand-900">
            {botLabel(bot)}
          </span>

          {shardCount !== null && (
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded hidden sm:inline">
              ✦ {shardCount.toLocaleString()}
            </span>
          )}
        </div>

        {/* Action button strip */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => fetchSnapshot()}
            title="Refresh logs"
            className="p-1 rounded text-brand-500 hover:text-brand-900 hover:bg-brand-50 transition"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
          <button
            onClick={() => setLogs([])}
            title="Clear logs"
            className="p-1 rounded text-brand-500 hover:text-brand-900 hover:bg-brand-50 transition"
          >
            <Eraser className="h-3 w-3" />
          </button>
          <Link
            href={`/bots?bot=${encodeURIComponent(bot.id)}`}
            title="Open Dedicated Console & Modules"
            className="p-1 rounded text-brand-500 hover:text-brand-900 hover:bg-brand-50 transition"
          >
            <ArrowUpRight className="h-3 w-3" />
          </Link>

          {isRunning ? (
            <button
              onClick={() => handleLifecycle('stop')}
              disabled={busyAction}
              title="Stop bot"
              className="ml-1 rounded bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-semibold text-red-300 hover:bg-red-500/30 transition flex items-center gap-1"
            >
              <CircleStop className="h-3 w-3" />
              Stop
            </button>
          ) : (
            <button
              onClick={() => handleLifecycle('start')}
              disabled={busyAction}
              title="Start bot"
              className="ml-1 rounded bg-brand-50 border border-brand-200 px-2 py-0.5 text-[10px] font-semibold text-brand-900 hover:bg-brand-50 transition flex items-center gap-1"
            >
              <Play className="h-3 w-3" />
              Start
            </button>
          )}
        </div>
      </div>

      {/* Terminal Viewport */}
      <div
        ref={scrollRef}
        className="console-scrollbar h-64 overflow-y-auto p-3 font-mono text-[11px] leading-5 space-y-0.5 bg-[#030303]"
      >
        {isRunning ? (
          logs.length > 0 ? (
            logs.map((row, idx) => (
              <div key={`${row.t || 'log'}-${idx}`} className="flex items-start gap-2 hover:bg-brand-50 px-1 rounded transition">
                <span className="w-14 shrink-0 select-none text-[9px] text-brand-500">
                  {row.t ? new Date(row.t).toLocaleTimeString([], { hour12: false }) : ''}
                </span>
                <div className="min-w-0 flex-1 break-words">
                  {renderLine(row.line)}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-brand-500 space-y-1">
              <Cpu className="h-6 w-6 text-brand-500 animate-pulse" />
              <p className="text-[11px]">Worker active. Waiting for Minecraft output...</p>
            </div>
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-brand-500 space-y-2">
            <Bot className="h-7 w-7 text-brand-500" />
            <p className="text-xs font-semibold text-brand-500">Bot is currently stopped</p>
            <Button
              size="sm"
              variant="secondary"
              loading={busyAction}
              onClick={() => handleLifecycle('start')}
              className="text-xs"
            >
              <Play className="h-3 w-3 mr-1 text-brand-900" />
              Spawn Worker
            </Button>
          </div>
        )}
      </div>

      {/* Quick Macro Chips */}
      {isRunning && (
        <div className="flex items-center gap-1 border-t border-brand-200 bg-white px-2 py-1 overflow-x-auto custom-scroll">
          {['!status', '!ping', '!inv', '!mine', '!sell', '!drop', '!shard'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => sendCmd(m)}
              className="shrink-0 rounded border border-brand-200 bg-brand-50 px-1.5 py-0.5 font-mono text-[9px] text-brand-500 hover:text-brand-900 hover:border-brand-200 transition"
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Command Prompt */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendCmd();
        }}
        className="flex items-center gap-1.5 border-t border-brand-200 bg-brand-50 p-2"
      >
        <span className="shrink-0 pl-1 font-mono text-xs text-brand-500">&gt;</span>
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          disabled={!isRunning}
          className="min-w-0 flex-1 bg-transparent px-1.5 py-1 font-mono text-xs text-brand-900 outline-none placeholder:text-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
          placeholder={isRunning ? "Send command (e.g. !say Hello, !pos)..." : "Bot offline"}
          autoComplete="off"
          spellCheck={false}
        />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          loading={sending}
          disabled={!command.trim() || !isRunning}
          className="h-7 px-2.5 text-xs text-brand-500 hover:text-brand-900"
        >
          <Send className="h-3 w-3" />
        </Button>
      </form>
    </div>
  );
}

export default function MultiConsoleTilesPage() {
  const { bots, refreshBots, loading } = useDashboard();
  const { user } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [massCmd, setMassCmd] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [gridCols, setGridCols] = useState(2); // 1, 2, 3, or 4

  // Filter bots
  const filteredBots = useMemo(() => {
    return bots.filter((b) => {
      const query = search.toLowerCase();
      const matchSearch =
        (b.id || '').toLowerCase().includes(query) ||
        (b.config?.username || '').toLowerCase().includes(query) ||
        (b.config?.host || '').toLowerCase().includes(query) ||
        categoryOf(b).toLowerCase().includes(query);

      const matchStatus = filterStatus === 'all' || b.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [bots, search, filterStatus]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredBots.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBots.map((b) => b.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Mass command broadcaster
  const handleBroadcast = async (cmdText) => {
    const value = (cmdText || massCmd).trim();
    if (!value) return;
    setBroadcasting(true);
    try {
      const targetIds = selectedIds.size > 0 ? Array.from(selectedIds) : null;
      const res = await api('/mass-cmd', {
        method: 'POST',
        body: JSON.stringify({ cmd: value, botIds: targetIds }),
      });
      toast(`Command broadcasted to ${res.total || 0} worker(s)`, 'success');
      setMassCmd('');
    } catch (err) {
      toast(err.message || 'Broadcast failed', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  // Mass batch lifecycle
  const handleBatchLifecycle = async (action) => {
    const targets = selectedIds.size > 0
      ? bots.filter((b) => selectedIds.has(b.id))
      : bots;

    const toProcess = action === 'start'
      ? targets.filter((b) => b.status !== 'running')
      : targets.filter((b) => b.status === 'running');

    if (!toProcess.length) {
      toast(`No bots to ${action}`, 'warning');
      return;
    }

    toast(`${action === 'start' ? 'Starting' : 'Stopping'} ${toProcess.length} bots...`, 'success');
    for (const b of toProcess) {
      try {
        await api(`/bots/${encodeURIComponent(b.id)}/${action}`, { method: 'POST' });
      } catch (_) { /* ignore */ }
    }
    setTimeout(refreshBots, 1200);
  };

  const runningCount = bots.filter((b) => b.status === 'running').length;
  const totalShards = bots.reduce((sum, b) => sum + (typeof b.shards === 'number' ? b.shards : 0), 0);

  // Dynamic grid classes
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[gridCols] || 'grid-cols-1 lg:grid-cols-2';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        eyebrow="Fleet Command Center"
        title="Multi-Console Terminal Matrix"
        description="Stream live terminal consoles for your entire bot swarm simultaneously on a single unified screen."
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="success"
              onClick={() => handleBatchLifecycle('start')}
              className="text-xs font-semibold"
            >
              <Play className="h-3.5 w-3.5 mr-1 text-brand-900" /> Start Active
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleBatchLifecycle('stop')}
              className="text-xs font-semibold"
            >
              <CircleStop className="h-3.5 w-3.5 mr-1" /> Stop All
            </Button>
            <Link href="/bots?action=new">
              <Button size="sm" variant="primary">
                + Deploy Bot
              </Button>
            </Link>
          </div>
        }
      />

      {/* 🚀 Top Mass Command Broadcaster Deck */}
      <Panel className="p-5 border-brand-200 bg-brand-50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-brand-200 pb-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 p-2 text-brand-900">
              <Terminal className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-brand-900 flex items-center gap-2">
                Mass Command Broadcaster
                {selectedIds.size > 0 && (
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.2 text-[10px] text-emerald-400 font-mono">
                    {selectedIds.size} Selected Targets
                  </span>
                )}
              </h3>
              <p className="text-xs text-brand-500">
                Targeting: {selectedIds.size > 0 ? `${selectedIds.size} selected bot(s)` : `All ${runningCount} currently running bot(s)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-brand-500 bg-white border border-brand-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Fleet Shards: <strong className="text-amber-400 font-bold">✦ {totalShards.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* Global Command Bar */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={massCmd}
              onChange={(e) => setMassCmd(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleBroadcast(); }}
              placeholder="Type mass command (e.g. !say Ready, !mine iron_ore, !sell, !drop, !goto 100 64 200, !stop)..."
              className="flex-1 rounded-xl border border-brand-200 bg-brand-50/80 px-4 py-2.5 text-xs font-mono text-brand-900 placeholder-brand-400 focus:border-brand-200 focus:outline-none"
            />
            <Button
              variant="primary"
              size="sm"
              loading={broadcasting}
              disabled={!massCmd.trim()}
              onClick={() => handleBroadcast()}
              className="font-semibold px-6"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Broadcast to Fleet
            </Button>
          </div>

          {/* Preset Macro Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-semibold text-brand-500 uppercase mr-1">Quick Fleet Macros:</span>
            {[
              { label: '!status', cmd: '!status' },
              { label: '!ping', cmd: '!ping' },
              { label: '!mine iron_ore', cmd: '!mine iron_ore' },
              { label: '!sell', cmd: '!sell' },
              { label: '!inv', cmd: '!inv' },
              { label: '!drop', cmd: '!drop' },
              { label: '!shard', cmd: '!shard' },
              { label: '!reconnect', cmd: '!reconnect' },
            ].map((m) => (
              <button
                key={m.label}
                type="button"
                onClick={() => handleBroadcast(m.cmd)}
                className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 font-mono text-[10px] text-brand-500 hover:border-brand-200 hover:text-brand-900 transition"
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {/* 🎛️ Layout Switcher & Filtering Toolbar */}
      <Panel className="p-4 border-brand-200 bg-brand-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleSelectAll}
            className="text-xs text-brand-500 hover:text-brand-900"
          >
            {selectedIds.size === filteredBots.length && filteredBots.length > 0 ? (
              <CheckSquare className="h-4 w-4 mr-1.5 text-brand-900" />
            ) : (
              <Square className="h-4 w-4 mr-1.5 text-brand-500" />
            )}
            {selectedIds.size === filteredBots.length && filteredBots.length > 0
              ? 'Deselect All'
              : `Select All (${filteredBots.length})`}
          </Button>

          <div className="h-4 w-px bg-brand-50" />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs text-brand-900 focus:outline-none"
          >
            <option value="all">All Bots ({bots.length})</option>
            <option value="running">Running ({runningCount})</option>
            <option value="stopped">Stopped ({bots.length - runningCount})</option>
          </select>
        </div>

        {/* Column layout switcher & search */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-brand-200 bg-white p-0.5">
            {[
              { cols: 1, icon: Columns2, label: '1 Col' },
              { cols: 2, icon: Columns2, label: '2 Col' },
              { cols: 3, icon: Columns3, label: '3 Col' },
              { cols: 4, icon: Columns4, label: '4 Col' },
            ].map((c) => (
              <button
                key={c.cols}
                onClick={() => setGridCols(c.cols)}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-lg transition ${
                  gridCols === c.cols
                    ? 'bg-brand-50 text-brand-900 font-bold'
                    : 'text-brand-500 hover:text-brand-900'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter terminals..."
              className="w-full sm:w-56 rounded-xl border border-brand-200 bg-white px-3 py-1.5 text-xs text-brand-900 placeholder-brand-400 focus:border-brand-200 focus:outline-none pl-8"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-500 pointer-events-none" />
          </div>
        </div>
      </Panel>

      {/* 🖥️ Multi-Console Terminal Matrix */}
      {loading ? (
        <div className={`grid gap-4 ${gridClass}`}>
          {[1, 2, 3, 4].map((i) => (
            <Panel key={i} className="p-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-10 w-full" />
            </Panel>
          ))}
        </div>
      ) : filteredBots.length > 0 ? (
        <div className={`grid gap-4 ${gridClass}`}>
          {filteredBots.map((bot) => (
            <BotTerminalTile
              key={bot.id}
              bot={bot}
              isSelected={selectedIds.has(bot.id)}
              onToggleSelect={toggleSelect}
              onRefreshList={refreshBots}
            />
          ))}
        </div>
      ) : (
        <Panel className="p-10">
          <EmptyState
            icon={Terminal}
            title="No bot terminals found"
            description="Deploy bots to open their simultaneous live terminal consoles in this command matrix."
            action={
              <Link href="/bots?action=new">
                <Button variant="primary">
                  + Deploy First Bot
                </Button>
              </Link>
            }
          />
        </Panel>
      )}
    </div>
  );
}
