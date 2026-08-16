'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Eraser, Send, Terminal, Play, CircleStop, RefreshCw, Sparkles, Shield, Cpu } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, EmptyState } from '@/components/ui';
import { useToast } from '@/components/providers';

const MAX_LOGS = 1500;

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
    return <span className="text-white font-mono">{line}</span>;
  }
  return <span className="text-white/70">{line}</span>;
}

export function BotConsole({ bot, onStatus }) {
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [sending, setSending] = useState(false);
  const [streamState, setStreamState] = useState('connecting');
  const scrollRef = useRef(null);
  const { toast } = useToast();

  // 1. Initial snapshot fetch + fallback polling
  const fetchSnapshot = useCallback(async () => {
    if (!bot?.id) return;
    try {
      const res = await api(`/bots/${encodeURIComponent(bot.id)}`);
      if (res.logs && Array.isArray(res.logs)) {
        setLogs(res.logs.slice(-MAX_LOGS).map(normalizeLog));
      }
      if (res.bot?.status) {
        onStatus?.(res.bot.status);
      }
    } catch (_) {
      /* ignore */
    }
  }, [bot?.id, onStatus]);

  // Initial load
  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  // 2. Real-time EventSource Stream + Auto Polling Fallback
  useEffect(() => {
    if (!bot?.id) return;

    let stream;
    try {
      stream = new EventSource(`/api/bots/${encodeURIComponent(bot.id)}/events`);
      stream.onopen = () => setStreamState('live');
      stream.onerror = () => setStreamState('reconnecting');
      stream.onmessage = (event) => {
        let payload;
        try { payload = JSON.parse(event.data); } catch { return; }
        if (payload.type === 'snapshot') {
          setLogs((payload.logs || []).slice(-MAX_LOGS).map(normalizeLog));
          if (payload.status) onStatus?.(payload.status);
        }
        if (payload.type === 'log') {
          setLogs((current) => [...current, normalizeLog(payload)].slice(-MAX_LOGS));
        }
        if (payload.type === 'status') {
          onStatus?.(payload.status);
        }
      };
    } catch (_) {
      setStreamState('polling');
    }

    // Polling heartbeat (every 2.5 seconds) to ensure logs never freeze
    const pollTimer = setInterval(() => {
      fetchSnapshot();
    }, 2500);

    return () => {
      if (stream) stream.close();
      clearInterval(pollTimer);
    };
  }, [bot?.id, fetchSnapshot, onStatus]);

  // Auto scroll to bottom
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [logs]);

  // Send Command to bot
  const send = async (cmdText) => {
    const value = (cmdText || command).trim();
    if (!value || !bot?.id) return;
    setSending(true);
    try {
      await api(`/bots/${encodeURIComponent(bot.id)}/cmd`, {
        method: 'POST',
        body: JSON.stringify({ cmd: value }),
      });
      setCommand('');
      // Optimistically push log to console
      setLogs((current) => [...current, { t: Date.now(), line: `> ${value}` }]);
      // Refresh snapshot
      setTimeout(fetchSnapshot, 300);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    send();
  };

  if (!bot) return <EmptyState title="Select a bot" description="Choose a bot from the list to open its live console." />;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-2xl shadow-2xl flex flex-col">
      {/* Console Topbar */}
      <div className="flex h-12 items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`h-2 w-2 shrink-0 rounded-full ${
            streamState === 'live'
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse'
              : 'bg-amber-400'
          }`} />
          <span className="truncate font-mono text-xs font-bold text-white">
            {bot.id}
          </span>
          <span className="text-[10px] font-mono text-white/30 hidden sm:inline">
            ({bot.config?.host || 'server'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase tracking-wider text-white/40 border border-white/10 rounded px-1.5 py-0.5">
            {streamState === 'live' ? 'LIVE STREAM' : 'SYNCING'}
          </span>
          <button
            onClick={() => fetchSnapshot()}
            title="Refresh logs"
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setLogs([])}
            title="Clear console"
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition"
          >
            <Eraser className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Viewport */}
      <div
        ref={scrollRef}
        className="console-scrollbar h-[440px] overflow-y-auto p-4 font-mono text-[11px] leading-5 space-y-1 bg-[#050505]"
      >
        {logs.length ? (
          logs.map((row, index) => (
            <div key={`${row.t || 'log'}-${index}`} className="flex items-start gap-3 hover:bg-white/[0.02] px-1 py-0.5 rounded transition">
              <span className="w-16 shrink-0 select-none text-[10px] text-white/20">
                {row.t ? new Date(row.t).toLocaleTimeString([], { hour12: false }) : ''}
              </span>
              <div className="min-w-0 flex-1 break-words">
                {renderLine(row.line)}
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-white/30 space-y-2">
            <Cpu className="h-8 w-8 text-white/20 animate-pulse" />
            <p className="text-xs">No logs recorded yet for this bot.</p>
            <p className="text-[10px] text-white/20">Click &quot;Start Bot&quot; to spawn the worker process and begin connection.</p>
          </div>
        )}
      </div>

      {/* Quick Macro Commands Bar */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] bg-black/40 px-3 py-2">
        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mr-1">Quick:</span>
        {[
          { label: '!status', cmd: '!status' },
          { label: '!ping', cmd: '!ping' },
          { label: '!pos', cmd: '!pos' },
          { label: '!inv', cmd: '!inv' },
          { label: '!help', cmd: '!help' },
          { label: '!reconnect', cmd: '!reconnect' },
        ].map((m) => (
          <button
            key={m.label}
            type="button"
            onClick={() => send(m.cmd)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-white/70 hover:border-white/20 hover:text-white transition"
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Command Input Form */}
      <form onSubmit={handleFormSubmit} className="flex items-center gap-2 border-t border-white/[0.08] bg-white/[0.02] p-3">
        <span className="shrink-0 pl-1 font-mono text-sm text-white/50">&gt;</span>
        <input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-2 py-1.5 font-mono text-xs text-white outline-none placeholder:text-white/20"
          placeholder="Send a bot command (e.g. !say Hello, !goto 100 64 200, !mine iron_ore)"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" size="sm" variant="primary" loading={sending} disabled={!command.trim()}>
          <Send className="h-3.5 w-3.5 mr-1" />
          Send
        </Button>
      </form>
    </div>
  );
}
