'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Activity, AlertTriangle, Bot, Braces, Check, CheckCircle2, CircleStop, Cpu, FileText,
  Globe, HardHat, Hash, Layers, Lock, Network, Package, Play, Plus,
  RefreshCw, Send, Server, Settings, Shield, ShieldAlert, Star,
  Trash2, User, WandSparkles
} from 'lucide-react';
import { useDashboard } from '@/components/dashboard-provider';
import { useAuth, useToast } from '@/components/providers';
import { Button, Checkbox, EmptyState, Modal, PageHeader, Panel, StatusBadge, Skeleton, Select } from '@/components/ui';
import { BotConsole } from '@/components/bot-console';
import { api } from '@/lib/api';
import { botLabel, categoryOf } from '@/lib/format';

export default function BotsPage() {
  const { bots, proxies, loading, refreshBots } = useDashboard();
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isFreeTier = user?.preferences?.tier === 'free' && user?.role !== 'admin';

  // Selected bot state
  const paramBotId = searchParams.get('bot');
  const selectedBotId = paramBotId || (bots.length > 0 ? bots[0].id : null);
  const selectedBot = useMemo(() => bots.find((b) => b.id === selectedBotId), [bots, selectedBotId]);

  // Active tab in details
  const [activeTab, setActiveTab] = useState('console');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Form states for Add Bot
  const [formId, setFormId] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formHost, setFormHost] = useState('play.bananasmp.net');
  const [formPort, setFormPort] = useState('25565');
  const [formCategory, setFormCategory] = useState('Default');
  const [formProxyId, setFormProxyId] = useState('');
  const [formAutoRegister, setFormAutoRegister] = useState(false);
  const [formAutoLogin, setFormAutoLogin] = useState(false);
  const [formPassword, setFormPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail panel state (fetched details)
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Modules & Scripts of selected bot
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const [moduleFormOpts, setModuleFormOpts] = useState({});
  const [savingModule, setSavingModule] = useState(false);

  const [scripts, setScripts] = useState([]);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [editingScriptId, setEditingScriptId] = useState(null);
  const [scriptTitle, setScriptTitle] = useState('');
  const [scriptCode, setScriptCode] = useState('');

  useEffect(() => {
    if (searchParams.get('action') === 'new' || searchParams.get('new') === 'true') {
      setAddOpen(true);
    }
  }, [searchParams]);

  // Fetch bot extra details (inventory/logs) when bot changes
  useEffect(() => {
    if (!selectedBotId) {
      setDetails(null);
      return;
    }
    setDetailsLoading(true);
    api(`/bots/${encodeURIComponent(selectedBotId)}`)
      .then((res) => {
        setDetails(res);
      })
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setDetailsLoading(false));

    // Also reset tabs if needed or fetch active tab details
    if (activeTab === 'modules') {
      fetchModules(selectedBotId);
    } else if (activeTab === 'scripts') {
      fetchScripts(selectedBotId);
    }
  }, [selectedBotId, activeTab, toast]);

  const fetchModules = async (botId) => {
    setModulesLoading(true);
    try {
      const res = await api(`/bots/${encodeURIComponent(botId)}/modules`);
      setModules(res.modules || []);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setModulesLoading(false);
    }
  };

  const fetchScripts = async (botId) => {
    setScriptsLoading(true);
    try {
      const res = await api(`/bots/${encodeURIComponent(botId)}/scripts`);
      setScripts(res.scripts || []);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setScriptsLoading(false);
    }
  };

  // Toggle selected bot selection
  const selectBot = (id) => {
    router.push(`/bots?bot=${encodeURIComponent(id)}`);
  };

  // Lifecycle control (start/stop)
  const [actionBusy, setActionBusy] = useState(false);
  const handleLifecycle = async (action) => {
    if (!selectedBot) return;
    setActionBusy(true);
    try {
      await api(`/bots/${encodeURIComponent(selectedBot.id)}/${action}`, { method: 'POST' });
      toast(`${botLabel(selectedBot)} ${action === 'start' ? 'started' : 'stopped'}`, 'success');
      refreshBots();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setActionBusy(false);
    }
  };

  // Module toggle
  const toggleModule = async (modKey, running) => {
    if (!selectedBot) return;
    try {
      const action = running ? 'stop' : 'start';
      const res = await api(`/bots/${encodeURIComponent(selectedBot.id)}/modules`, {
        method: 'POST',
        body: JSON.stringify({ key: modKey, action })
      });
      setModules(res.modules || []);
      toast(`Module ${modKey} ${running ? 'stopped' : 'started'}`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Open Module Config Modal
  const openModuleConfig = (mod) => {
    setActiveModule(mod);
    setModuleFormOpts(mod.savedOpts || mod.opts || {});
    setModuleModalOpen(true);
  };

  // Save Module settings from Modal
  const handleSaveModuleConfig = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedBot || !activeModule) return;
    setSavingModule(true);
    try {
      const res = await api(`/bots/${encodeURIComponent(selectedBot.id)}/modules`, {
        method: 'POST',
        body: JSON.stringify({ key: activeModule.key, action: 'apply', opts: moduleFormOpts })
      });
      setModules(res.modules || []);
      toast(`Settings saved for ${activeModule.label}`, 'success');
      setModuleModalOpen(false);
    } catch (err) {
      toast(err.message || 'Failed to update module configuration', 'error');
    } finally {
      setSavingModule(false);
    }
  };

  // Scripts control
  const openNewScriptModal = () => {
    setEditingScriptId(null);
    setScriptTitle('');
    setScriptCode('// Nora Automation Script\n\nmodule.exports = async (bot) => {\n  bot.say("Hello from script!");\n};');
    setScriptOpen(true);
  };

  const openEditScriptModal = (script) => {
    setEditingScriptId(script.id);
    setScriptTitle(script.id);
    setScriptCode(script.content || '');
    setScriptOpen(true);
  };

  const handleSaveScript = async () => {
    if (!selectedBot || !scriptTitle.trim()) return;
    try {
      await api(`/bots/${encodeURIComponent(selectedBot.id)}/scripts`, {
        method: 'POST',
        body: JSON.stringify({ id: scriptTitle.trim(), content: scriptCode })
      });
      toast('Script saved successfully', 'success');
      setScriptOpen(false);
      fetchScripts(selectedBot.id);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleDeleteScript = async (sid) => {
    if (!selectedBot || !confirm(`Delete script "${sid}"?`)) return;
    try {
      await api(`/bots/${encodeURIComponent(selectedBot.id)}/scripts/${encodeURIComponent(sid)}`, {
        method: 'DELETE'
      });
      toast('Script deleted', 'success');
      fetchScripts(selectedBot.id);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleRunScript = async (sid) => {
    if (!selectedBot) return;
    try {
      await api(`/bots/${encodeURIComponent(selectedBot.id)}/scripts/${encodeURIComponent(sid)}/run`, {
        method: 'POST'
      });
      toast(`Script "${sid}" executed`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Bot creation
  const handleAddBot = async (e) => {
    e.preventDefault();
    if (!formUsername.trim()) return;
    setSubmitting(true);
    try {
      const res = await api('/bots', {
        method: 'POST',
        body: JSON.stringify({
          id: formId.trim() || undefined,
          username: formUsername.trim(),
          host: formHost.trim(),
          port: formPort.trim(),
          category: formCategory.trim(),
          proxyId: formProxyId || undefined,
          autoRegister: formAutoRegister,
          autoLogin: formAutoLogin,
          loginPassword: formPassword || undefined
        })
      });
      toast('Bot added successfully', 'success');
      setAddOpen(false);
      refreshBots();
      if (res.bot) selectBot(res.bot.id);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Bot deletion
  const handleDeleteBot = async () => {
    if (!selectedBot || !confirm(`Are you absolutely sure you want to delete ${botLabel(selectedBot)}? This will completely wipe its localized folders.`)) return;
    try {
      await api(`/bots/${encodeURIComponent(selectedBot.id)}`, { method: 'DELETE' });
      toast('Bot deleted', 'success');
      setEditOpen(false);
      refreshBots();
      router.push('/bots');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Edit bot setup
  const [editCategory, setEditCategory] = useState('');
  const [editHost, setEditHost] = useState('');
  const [editPort, setEditPort] = useState('');
  const [editProxyId, setEditProxyId] = useState('');
  const [editAutoRegister, setEditAutoRegister] = useState(false);
  const [editAutoLogin, setEditAutoLogin] = useState(false);
  const [editPassword, setEditPassword] = useState('');

  const openEditModal = () => {
    if (!selectedBot) return;
    setEditCategory(selectedBot.config?.category || 'Default');
    setEditHost(selectedBot.config?.host || 'play.bananasmp.net');
    setEditPort(String(selectedBot.config?.port || '25565'));
    setEditAutoRegister(!!selectedBot.config?.autoRegister);
    setEditAutoLogin(!!selectedBot.config?.autoLogin);
    setEditPassword(selectedBot.config?.loginPassword || '');
    
    // Find matching proxy id
    const matchedProxy = proxies.find((p) => p.uri === selectedBot.config?.proxy);
    setEditProxyId(matchedProxy ? matchedProxy.id : '');
    setEditOpen(true);
  };

  const handleEditBot = async (e) => {
    e.preventDefault();
    if (!selectedBot) return;
    setSubmitting(true);
    try {
      await api(`/bots/${encodeURIComponent(selectedBot.id)}/config`, {
        method: 'PATCH',
        body: JSON.stringify({
          category: editCategory.trim(),
          host: editHost.trim(),
          port: editPort.trim(),
          proxyId: editProxyId || null,
          autoRegister: editAutoRegister,
          autoLogin: editAutoLogin,
          loginPassword: editPassword || null
        })
      });
      toast('Bot config updated', 'success');
      setEditOpen(false);
      refreshBots();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and search logic
  const filteredBots = useMemo(() => {
    return bots.filter((bot) => {
      const label = botLabel(bot).toLowerCase();
      const host = (bot.config?.host || '').toLowerCase();
      const category = categoryOf(bot).toLowerCase();
      const query = search.toLowerCase();

      const matchesQuery = label.includes(query) || host.includes(query) || category.includes(query);
      const matchesStatus = filterStatus === 'all' || bot.status === filterStatus;

      return matchesQuery && matchesStatus;
    });
  }, [bots, search, filterStatus]);

  // Minecraft inventory representation
  const renderInventoryGrid = () => {
    if (detailsLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      );
    }

    const inv = details?.inventory;
    if (!inv || !inv.items) {
      return <EmptyState icon={WandSparkles} title="Inventory empty or offline" description="Start the bot and connect it to a server to load its live inventory details." />;
    }

    // Slots index:
    // Armor: 5,6,7,8 (head, chest, legs, feet)
    // Main inventory: 9-35 (3 rows of 9)
    // Hotbar: 36-44 (1 row of 9)
    // Offhand: 45
    const slots = {};
    inv.items.forEach((it) => {
      slots[it.slot] = it;
    });
    if (inv.armor) {
      inv.armor.forEach((it) => {
        slots[it.slot] = it;
      });
    }

    const getSlotContent = (index) => {
      const it = slots[index];
      if (!it) return null;
      return (
        <div className="group relative flex h-full w-full items-center justify-center bg-brand-50 transition hover:bg-brand-50" title={`${it.displayName} (Count: ${it.count})`}>
          <Package className="h-5 w-5 text-brand-500" />
          <span className="tnum absolute bottom-1 right-1 text-[10px] font-bold text-brand-900">{it.count > 1 ? it.count : ''}</span>
          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 scale-90 rounded-lg bg-brand-50 px-2.5 py-1.5 text-[11px] text-brand-900 opacity-0 shadow-xl transition-all group-hover:scale-100 group-hover:opacity-100">
            <p className="font-semibold">{it.displayName || it.name}</p>
            <p className="mt-0.5 text-[9px] text-brand-500">Slot {index} · {it.name}</p>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* Armor & Offhand */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {[5, 6, 7, 8].map((s) => (
              <div key={s} className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-brand-200 bg-brand-50">
                <span className="absolute left-1 top-0.5 text-[8px] text-brand-500">{['H', 'C', 'L', 'F'][s - 5]}</span>
                {getSlotContent(s)}
              </div>
            ))}
          </div>
          <div className="h-8 w-px bg-brand-50" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-500">Offhand:</span>
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-brand-200 bg-brand-50">
              {getSlotContent(45)}
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">Main Inventory</p>
          <div className="grid grid-cols-9 gap-1.5 rounded-2xl border border-brand-200 bg-brand-50 p-2">
            {Array.from({ length: 27 }, (_, i) => i + 9).map((s) => (
              <div key={s} className="relative aspect-square rounded-lg border border-brand-200 bg-white overflow-hidden">
                <span className="absolute left-1 top-0.5 text-[7px] text-brand-500 select-none">{s}</span>
                {getSlotContent(s)}
              </div>
            ))}
          </div>
        </div>

        {/* Hotbar */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">Hotbar</p>
          <div className="grid grid-cols-9 gap-1.5 rounded-2xl border border-brand-200 bg-brand-50 p-2">
            {Array.from({ length: 9 }, (_, i) => i + 36).map((s) => (
              <div key={s} className="relative aspect-square rounded-lg border border-brand-200 bg-white overflow-hidden">
                <span className="absolute left-1 top-0.5 text-[7px] text-brand-500 select-none">{s}</span>
                {getSlotContent(s)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        eyebrow="Fleet Orchestration"
        title="Bot Workers"
        description="Deploy and manage autonomous Minecraft workers across your server infrastructure."
        actions={
          <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Deploy Bot
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
        {/* LEFT COLUMN: Bot Roster */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500">Roster ({bots.length})</span>
            <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)} className="text-xs">
              <Plus className="h-3 w-3 mr-1" /> Add Bot
            </Button>
          </div>

          {/* Search and status filter */}
          <div className="space-y-2">
            <input
              className="field-control text-xs"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, server, category..."
            />
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'running', label: 'Running' },
                { value: 'stopped', label: 'Stopped' },
                { value: 'error', label: 'Error' },
              ]}
            />
          </div>

          {/* Fleet loading skeleton or list */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="panel-surface p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 shrink-0" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredBots.length > 0 ? (
            <div className="space-y-1.5 max-h-[72vh] overflow-y-auto console-scrollbar pr-1">
              {filteredBots.map((b) => {
                const active = b.id === selectedBotId;
                return (
                  <button
                    key={b.id}
                    onClick={() => selectBot(b.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center justify-between ${
                      active
                        ? 'border-brand-200 bg-brand-50 text-brand-900'
                        : 'border-brand-200 bg-brand-50 text-brand-500 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-900'
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-xs font-black uppercase text-brand-500">
                        {botLabel(b).slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <strong className="block truncate text-xs font-semibold">{botLabel(b)}</strong>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="truncate text-[10px] text-brand-500">{b.config?.host || 'No server'}</span>
                          {typeof b.shards === 'number' && (
                            <span className="text-[9px] font-mono text-amber-400 font-bold">✦ {b.shards.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Bot}
              title="No bots found"
              description="Deploy your first autonomous Minecraft bot to get started."
              action={
                <Button variant="primary" onClick={() => setAddOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Deploy Bot
                </Button>
              }
            />
          )}
        </div>

      {/* RIGHT COLUMN: Bot Workspace */}
      <div className="min-w-0">
        {selectedBot ? (
          <div className="space-y-6">
            {/* Header detail */}
            <Panel className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-lg font-black uppercase">
                  {botLabel(selectedBot).slice(0, 2)}
                </span>
                <div>
                  <h2 className="text-[20px] font-semibold text-brand-900 flex items-center gap-2">
                    {botLabel(selectedBot)}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-50 border border-brand-200 text-brand-500">{selectedBot.id}</span>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1">
                      ✦ {typeof selectedBot.shards === 'number' ? selectedBot.shards.toLocaleString() : '--'} Shards
                    </span>
                  </h2>
                  <p className="mt-1 text-xs text-brand-500">
                    Category: <span className="text-brand-500">{categoryOf(selectedBot)}</span> · Server: <span className="text-brand-500">{selectedBot.config?.host}:{selectedBot.config?.port}</span>
                  </p>
                </div>
              </div>

              {/* Bot Controller Button Bar */}
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={openEditModal}>
                  <Settings className="h-3.5 w-3.5" />Config
                </Button>
                {selectedBot.status === 'running' ? (
                  <Button size="sm" variant="danger" onClick={() => handleLifecycle('stop')} loading={actionBusy}>
                    <CircleStop className="h-3.5 w-3.5" />Stop Bot
                  </Button>
                ) : (
                  <Button size="sm" variant="success" onClick={() => handleLifecycle('start')} loading={actionBusy}>
                    <Play className="h-3.5 w-3.5 text-brand-900" />Start Bot
                  </Button>
                )}
              </div>
            </Panel>

            {/* TAB STRIP */}
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-brand-200 bg-brand-50 p-1 backdrop-blur-xl">
              {[
                { value: 'console', label: 'Console', icon: Cpu },
                { value: 'inventory', label: 'Inventory', icon: WandSparkles },
                { value: 'modules', label: 'Modules', icon: Activity },
                { value: 'scripts', label: 'Scripts', icon: Braces },
              ].map((tab) => {
                const active = activeTab === tab.value;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-medium transition-all duration-300 ${
                      active ? 'bg-brand-50 text-brand-900 font-semibold' : 'text-brand-500 hover:bg-brand-50 hover:text-brand-900'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ACTIVE CONTENT AREA */}
            <div className="min-h-[480px]">
              {/* Console Tab */}
              {activeTab === 'console' && (
                <BotConsole bot={selectedBot} onStatus={refreshBots} />
              )}

              {/* Inventory Tab */}
              {activeTab === 'inventory' && (
                <Panel className="p-6">
                  {renderInventoryGrid()}
                </Panel>
              )}

              {/* Modules Tab */}
              {activeTab === 'modules' && (
                <div className="space-y-4">
                  {modulesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Panel key={i} className="p-6 space-y-3">
                          <Skeleton className="h-5 w-44" />
                          <Skeleton className="h-10 w-full" />
                        </Panel>
                      ))}
                    </div>
                  ) : modules.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {modules.map((m) => (
                        <Panel key={m.key} className="p-5 flex flex-col justify-between h-full gap-4">
                          <div>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-sm text-brand-900 flex items-center gap-2">
                                {m.label}
                                {m.running && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                              </h3>
                              <span className="text-[9px] uppercase tracking-wider text-brand-500 px-1.5 py-0.5 rounded bg-brand-50 border border-brand-200">{m.group}</span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-brand-500">{m.describe}</p>
                            {m.detail && <p className="mt-2 font-mono text-[10px] text-brand-500 bg-white px-2 py-1.5 rounded-lg border border-brand-200">{m.detail}</p>}
                          </div>

                          <div className="flex items-center justify-between border-t border-brand-200 pt-3.5">
                            {/* If editable fields, render edit modal or inline action */}
                            {m.editable ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => openModuleConfig(m)}
                                className="text-xs"
                              >
                                <Settings className="h-3 w-3 mr-1" />
                                Configure
                              </Button>
                            ) : <span />}

                            <Button size="sm" variant={m.running ? 'danger' : 'success'} onClick={() => toggleModule(m.key, m.running)}>
                              {m.running ? 'Disable' : 'Enable'}
                            </Button>
                          </div>
                        </Panel>
                      ))}
                    </div>
                  ) : (
                    <Panel className="p-6">
                      <EmptyState icon={Cpu} title="No modules found" description="No available modules reported for this bot process." />
                    </Panel>
                  )}
                </div>
              )}

              {/* Scripts Tab */}
              {activeTab === 'scripts' && (
                <Panel className="p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-sm text-brand-900">Bot Scripts</h3>
                      <p className="text-xs text-brand-500 mt-1">Upload/hot-reload local automation behavior scripts without restarting.</p>
                    </div>
                    <Button size="sm" onClick={openNewScriptModal}>
                      <Plus className="h-3.5 w-3.5" />New Script
                    </Button>
                  </div>

                  {scriptsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : scripts.length > 0 ? (
                    <div className="divide-y divide-white/[0.05] border border-brand-200 bg-brand-50/20 rounded-2xl overflow-hidden">
                      {scripts.map((sc) => (
                        <div key={sc.id} className="p-4 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <span className="font-mono text-xs text-brand-900 font-medium flex items-center gap-2">
                              📄 {sc.id}.js
                              {sc.enabled && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                            </span>
                            <span className="block text-[10px] text-brand-500 mt-1">Local behavior extension</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button size="sm" variant="ghost" onClick={() => openEditScriptModal(sc)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="success" onClick={() => handleRunScript(sc.id)}>
                              Run
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleDeleteScript(sc.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={Braces} title="No scripts uploaded" description="Create behavior scripts in javascript to extend Nora's capability dynamically." action={<Button size="sm" onClick={openNewScriptModal}>Create First Script</Button>} />
                  )}
                </Panel>
              )}
            </div>
          </div>
        ) : (
          <Panel className="p-8">
            <EmptyState
              icon={Bot}
              title="No bot selected"
              description="Deploy a new bot or select an existing worker instance from the roster to monitor and control."
              action={
                <Button variant="primary" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Deploy New Bot
                </Button>
              }
            />
          </Panel>
        )}
      </div>
    </div>

      {/* MODAL: Add Bot */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Deploy New Bot" description="Spin up a new autonomous worker instance.">
        <form onSubmit={handleAddBot} className="space-y-6">
          
          {/* Section: Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-brand-200 pb-2">
              <User className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-medium text-brand-500">Identity</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Bot ID (Unique)</span>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Hash className="h-4 w-4 text-brand-500" />
                  </div>
                  <input
                    className="field-control pl-9"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="bot-1"
                  />
                </div>
              </label>
              <label className="block">
                <span className="field-label">Minecraft Username</span>
                <input
                  className="field-control"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="NoraWorker"
                  required
                />
              </label>
            </div>
            <label className="block">
              <span className="field-label">Category</span>
              <input
                className="field-control"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Farming"
              />
            </label>
          </div>

          {/* Section: Connection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-brand-200 pb-2">
              <Server className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-medium text-brand-500">Connection</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Server Host / IP</span>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Globe className="h-4 w-4 text-brand-500" />
                  </div>
                  <input
                    className="field-control pl-9"
                    value={formHost}
                    onChange={(e) => setFormHost(e.target.value)}
                    placeholder="play.bananasmp.net"
                    required
                  />
                </div>
              </label>
              <label className="block">
                <span className="field-label">Server Port</span>
                <input
                  className="field-control"
                  value={formPort}
                  onChange={(e) => setFormPort(e.target.value)}
                  placeholder="25565"
                  required
                />
              </label>
            </div>

            <div>
              <ProxyPicker
                value={formProxyId}
                onChange={setFormProxyId}
                proxies={proxies}
                isFreeTier={isFreeTier}
              />
            </div>
          </div>

          {/* Section: Advanced (Handshake) */}
          <div className="space-y-4 bg-brand-50 border border-brand-200 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-brand-500" />
              <p className="text-sm font-medium text-brand-500">Cracked Authentication Handshakes</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Checkbox checked={formAutoRegister} onChange={setFormAutoRegister} label="Auto-Register" description="Register on cracked spawns." />
              <Checkbox checked={formAutoLogin} onChange={setFormAutoLogin} label="Auto-Login" description="Login automatically." />
            </div>
            {(formAutoRegister || formAutoLogin) && (
              <label className="block mt-2">
                <span className="field-label">Handshake Password</span>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-brand-500" />
                  </div>
                  <input
                    className="field-control pl-9"
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Secret registration password"
                    required
                  />
                </div>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-brand-200 pt-5 mt-6">
            <Button type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={submitting} className="px-6 py-2">
              <Play className="h-4 w-4 mr-2" />
              Deploy Bot
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Config Bot */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Bot Configuration" description={selectedBot ? botLabel(selectedBot) : ''}>
        <form onSubmit={handleEditBot} className="space-y-6">
          
          {/* Section: Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-brand-200 pb-2">
              <User className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-medium text-brand-500">Identity</h3>
            </div>
            <label className="block">
              <span className="field-label">Category</span>
              <input
                className="field-control"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder="Farming"
              />
            </label>
          </div>

          {/* Section: Connection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-brand-200 pb-2">
              <Server className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-medium text-brand-500">Connection</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Server Host / IP</span>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Globe className="h-4 w-4 text-brand-500" />
                  </div>
                  <input
                    className="field-control pl-9"
                    value={editHost}
                    onChange={(e) => setEditHost(e.target.value)}
                    placeholder="play.bananasmp.net"
                    required
                  />
                </div>
              </label>
              <label className="block">
                <span className="field-label">Server Port</span>
                <input
                  className="field-control"
                  value={editPort}
                  onChange={(e) => setEditPort(e.target.value)}
                  placeholder="25565"
                  required
                />
              </label>
            </div>

            <div>
              <ProxyPicker
                value={editProxyId}
                onChange={setEditProxyId}
                proxies={proxies}
                isFreeTier={isFreeTier}
              />
            </div>
          </div>

          {/* Section: Advanced (Handshake) */}
          <div className="space-y-4 bg-brand-50 border border-brand-200 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-medium text-brand-500">Handshake Config</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Checkbox checked={editAutoRegister} onChange={setEditAutoRegister} label="Auto-Register" />
              <Checkbox checked={editAutoLogin} onChange={setEditAutoLogin} label="Auto-Login" />
            </div>
            {(editAutoRegister || editAutoLogin) && (
              <label className="block mt-2">
                <span className="field-label">Handshake Password</span>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-brand-500" />
                  </div>
                  <input
                    className="field-control pl-9"
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Password"
                    required
                  />
                </div>
              </label>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-brand-200 pt-5 mt-6">
            <Button type="button" variant="danger" onClick={handleDeleteBot} className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Wipe Bot
            </Button>
            <div className="flex gap-3">
              <Button type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Save Config</Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL: Script Creator / Editor */}
      <Modal open={scriptOpen} onClose={() => setScriptOpen(false)} title={editingScriptId ? 'Edit Script' : 'Create Custom Script'} description="Inject Javascript behaviors straight into the bot's runtime.">
        <div className="space-y-4">
          <label className="block">
            <span className="field-label">Script Title / Name</span>
            <input
              className="field-control font-mono text-xs"
              value={scriptTitle}
              onChange={(e) => setScriptTitle(e.target.value)}
              placeholder="mine-obsidian"
              disabled={!!editingScriptId}
              required
            />
          </label>

          <label className="block">
            <span className="field-label">Script Javascript Code</span>
            <textarea
              className="field-control min-h-80 resize-y font-mono text-xs"
              value={scriptCode}
              onChange={(e) => setScriptCode(e.target.value)}
              required
            />
          </label>

          <div className="flex justify-end gap-2 border-t border-brand-200 pt-4 mt-6">
            <Button type="button" onClick={() => setScriptOpen(false)}>Cancel</Button>
            <Button type="button" variant="primary" onClick={handleSaveScript}>Save & Inject</Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Module Settings Config */}
      <Modal
        open={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        title={`Configure: ${activeModule?.label || 'Module Settings'}`}
        description={activeModule?.describe || 'Adjust behavior settings for this automation module.'}
      >
        <form onSubmit={handleSaveModuleConfig} className="space-y-4 py-2">
          {activeModule?.fields && activeModule.fields.length > 0 ? (
            activeModule.fields.map((field) => {
              const val = moduleFormOpts[field.name] ?? field.default ?? '';
              const isBool = field.type === 'boolean' || field.type === 'bool';
              const isNum = field.type === 'number' || field.type === 'int' || field.type === 'float';

              if (isBool) {
                return (
                  <div key={field.name} className="p-3 rounded-xl border border-brand-200 bg-brand-50">
                    <Checkbox
                      checked={!!val}
                      onChange={(checked) => setModuleFormOpts((prev) => ({ ...prev, [field.name]: checked }))}
                      label={field.label || field.name}
                      description={field.description || field.describe || ''}
                    />
                  </div>
                );
              }

              return (
                <label key={field.name} className="block">
                  <span className="field-label flex items-center justify-between">
                    <span>{field.label || field.name}</span>
                    {field.unit && <span className="text-[10px] text-brand-500">({field.unit})</span>}
                  </span>
                  <input
                    type={isNum ? 'number' : 'text'}
                    className="field-control font-mono text-xs"
                    value={val}
                    onChange={(e) => {
                      const nextVal = isNum ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
                      setModuleFormOpts((prev) => ({ ...prev, [field.name]: nextVal }));
                    }}
                    placeholder={String(field.default ?? '')}
                    required={field.required}
                  />
                  {field.description && (
                    <p className="mt-1 text-[11px] text-brand-500">{field.description}</p>
                  )}
                </label>
              );
            })
          ) : (
            <div className="p-4 rounded-xl border border-brand-200 bg-brand-50 text-xs text-brand-500">
              This module does not require custom parameters. You can enable or disable it directly.
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-brand-200 pt-4 mt-6">
            <Button type="button" onClick={() => setModuleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingModule}>
              Save Settings
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ProxyPicker({ value, onChange, proxies = [], isFreeTier }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="field-label mb-0">Proxy Route Selection</span>
        <span className="text-[10px] text-brand-500">{proxies.length} endpoints available</span>
      </div>
      <div className="grid gap-2 max-h-48 overflow-y-auto custom-scroll pr-1">
        {/* Direct Option */}
        <button
          type="button"
          onClick={() => onChange('')}
          className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition ${
            !value
              ? 'border-brand-200 bg-brand-50 text-brand-900'
              : 'border-brand-200 bg-white text-brand-500 hover:border-brand-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-brand-50" />
            <div>
              <span className="text-xs font-semibold block text-brand-900">
                {isFreeTier ? 'Admin Free Proxy (Auto-assigned)' : 'Direct Connection (No Proxy)'}
              </span>
              <span className="text-[10px] text-brand-500">
                {isFreeTier ? 'Routed through verified public system pool' : 'Direct connection without SOCKS5 tunneling'}
              </span>
            </div>
          </div>
          {!value && <Check className="h-3.5 w-3.5 text-brand-900 shrink-0" />}
        </button>

        {/* Proxies List */}
        {proxies.map((p) => {
          const isSelected = value === p.id;
          const isOnline = p.alive;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition ${
                isSelected
                  ? 'border-brand-200 bg-brand-50 text-brand-900'
                  : 'border-brand-200 bg-white text-brand-500 hover:border-brand-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`h-2 w-2 rounded-full shrink-0 ${isOnline ? 'bg-emerald-400' : 'bg-brand-50'}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-brand-900 truncate">{p.label || `${p.host}:${p.port}`}</span>
                    {p.isFree && (
                      <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400">
                        Free Tier
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-brand-500 block truncate">
                    {p.latency ? `${p.latency}ms latency` : 'SOCKS5'} · {p.freeSlots ?? 10} slots free
                  </span>
                </div>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-brand-900 shrink-0" />}
            </button>
          );
        })}
      </div>
      {isFreeTier && (
        <p className="text-[10px] text-amber-300/80">
          💡 Free Plan bots are connected through high-speed Admin Free Proxies automatically.
        </p>
      )}
    </div>
  );
}
