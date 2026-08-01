import { lazy, Suspense, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Clock3,
  Download,
  FolderOpen,
  Globe2,
  Image,
  MoreVertical,
  Play,
  Settings,
  Square
} from 'lucide-react'
import type { InstanceConfig, LaunchValidation } from '@shared/types'
import { LOADER_LABELS } from '@shared/types'
import {
  useContentUpdates,
  useInstanceBusy,
  useInstances,
  useRunning,
  useToasts,
  useUpdateCount,
  toastError
} from '@/stores/data'
import { useNav, type InstanceTab } from '@/stores/nav'
import { InstanceIcon } from '@/components/InstanceIcon'
import { LoaderMark } from '@/components/LoaderMark'
import { Button, Spinner } from '@/components/ui/ui'
import { formatPlaytime } from '@/lib/util'
import { cn } from '@/lib/util'

const ContentTab = lazy(() => import('@/screens/tabs/ContentTab').then((m) => ({ default: m.ContentTab })))
const WorldsTab = lazy(() => import('@/screens/tabs/WorldsTab').then((m) => ({ default: m.WorldsTab })))
const ScreenshotsTab = lazy(() => import('@/screens/tabs/ScreenshotsTab').then((m) => ({ default: m.ScreenshotsTab })))
const LogsTab = lazy(() => import('@/screens/tabs/LogsTab').then((m) => ({ default: m.LogsTab })))
const FilesTab = lazy(() => import('@/screens/tabs/FilesTab').then((m) => ({ default: m.FilesTab })))
const OptionsTab = lazy(() => import('@/screens/tabs/OptionsTab').then((m) => ({ default: m.OptionsTab })))

const MAIN_TABS = [
  { id: 'content' as const, label: 'Content', icon: Boxes },
  { id: 'worlds' as const, label: 'Worlds', icon: Globe2 },
  { id: 'screenshots' as const, label: 'Screenshots', icon: Image },
  { id: 'files' as const, label: 'Files', icon: FolderOpen }
]

function LaunchButton({ inst }: { inst: InstanceConfig }): React.JSX.Element {
  const running = useRunning((s) => s.isRunning(inst.id))
  const push = useToasts((s) => s.push)
  const { go } = useNav()
  const [validation, setValidation] = useState<LaunchValidation | null>(null)
  const [launching, setLaunching] = useState(false)
  const busy = useInstanceBusy(inst.id) || launching

  useEffect(() => {
    let cancelled = false
    window.native.instances.validate(inst.id).then((v) => !cancelled && setValidation(v)).catch(() => undefined)
    return () => { cancelled = true }
  }, [inst.id, inst.mcVersion, inst.loader, inst.installed])

  const launch = async (): Promise<void> => {
    setLaunching(true)
    try {
      const result = await window.native.instances.validate(inst.id)
      const blocking = result.problems.find((p) => p.severity === 'error')
      if (blocking && !blocking.code.startsWith('java')) {
        toastError(new Error(blocking.message), "Can't launch yet")
        return
      }
      push({ kind: 'info', title: `${inst.installed ? 'Launching' : 'Installing'} ${inst.name}…`, detail: 'Preparing game files' })
      await window.native.instances.launch(inst.id)
      go({ name: 'instance', id: inst.id, tab: 'logs' })
    } catch (error) {
      toastError(error, `Couldn't launch ${inst.name}`)
    } finally {
      setLaunching(false)
    }
  }

  if (running) {
    return (
      <Button variant="danger" icon={Square} onClick={() => void window.native.instances.kill(inst.id)} className="h-12 min-w-[192px] rounded-[12px]">
        Stop
      </Button>
    )
  }

  const warn = validation?.problems.find((p) => p.severity === 'warn')
  return (
    <div className="flex items-center gap-2">
      {warn && <span title={warn.message} className="text-warn"><AlertTriangle size={18} /></span>}
      <Button
        icon={busy ? undefined : inst.installed ? Play : Download}
        onClick={launch}
        disabled={busy}
        data-testid="instance-play"
        className="h-12 min-w-[192px] rounded-[12px] bg-gradient-to-r from-accent to-accent-hover text-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,.25)] hover:brightness-110"
      >
        {busy ? <Spinner size={16} /> : inst.installed ? 'Play' : 'Install'}
      </Button>
    </div>
  )
}

function InstanceOverview({ inst }: { inst: InstanceConfig }): React.JSX.Element {
  const { go } = useNav()
  return (
    <section className="overflow-hidden rounded-[16px] border border-line-subtle bg-surface-raised">
      <div className="flex min-h-[129px] items-center gap-4 px-6 py-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[13px] border border-line-subtle bg-surface-inset">
          <InstanceIcon icon={inst.icon} name={inst.name} size={64} className="!rounded-[8px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-bold text-content-primary">
              <LoaderMark loader={inst.loader} size={13} />
              {LOADER_LABELS[inst.loader]}
            </span>
            <span className="h-4 w-px bg-line-strong" />
            <span className="font-mono text-content-secondary">MC {inst.mcVersion}</span>
            {inst.loaderVersion && inst.loader !== 'vanilla' && <span className="font-mono text-content-muted">• {inst.loaderVersion}</span>}
          </div>
          <h1 className="mt-2 truncate text-[29px] font-extrabold leading-9 tracking-[-0.035em] text-content-primary">{inst.name}</h1>
        </div>
        <LaunchButton inst={inst} />
      </div>

      <div className="grid h-16 grid-cols-[1fr_1fr_128px_58px] border-t border-line-subtle">
        <div className="flex flex-col justify-center border-r border-line-subtle px-6">
          <span className="text-[10px] font-medium tracking-[0.18em] text-content-muted">STATUS</span>
          <span className="mt-1 flex items-center gap-1.5 text-[12px] text-content-secondary">
            <AlertTriangle size={13} strokeWidth={1.6} /> {inst.installed ? 'Ready to play' : 'Not installed'}
          </span>
        </div>
        <div className="flex flex-col justify-center border-r border-line-subtle px-6">
          <span className="text-[10px] font-medium tracking-[0.18em] text-content-muted">PLAYTIME</span>
          <span className="mt-1 flex items-center gap-1.5 text-[12px] text-content-secondary">
            <Clock3 size={13} strokeWidth={1.6} /> {formatPlaytime(inst.totalPlayMs)}
          </span>
        </div>
        <button
          role="tab"
          aria-label="Options"
          aria-selected={false}
          onClick={() => go({ name: 'instance', id: inst.id, tab: 'options' })}
          className="flex flex-col items-center justify-center gap-1 border-r border-line-subtle text-content-secondary transition-colors hover:bg-surface-hover hover:text-accent"
        >
          <Settings size={16} strokeWidth={1.6} />
          <span className="text-[10px]">Instance Settings</span>
        </button>
        <button
          role="tab"
          aria-label="Logs"
          aria-selected={false}
          onClick={() => go({ name: 'instance', id: inst.id, tab: 'logs' })}
          className="flex flex-col items-center justify-center gap-1 text-content-secondary transition-colors hover:bg-surface-hover hover:text-accent"
        >
          <MoreVertical size={17} />
          <span className="text-[10px]">More</span>
        </button>
      </div>
    </section>
  )
}

export function InstanceScreen({ id, tab }: { id: string; tab: InstanceTab }): React.JSX.Element {
  const inst = useInstances((s) => s.byId(id))
  const { go, back, canBack } = useNav()
  const updateCount = useUpdateCount(id)

  useEffect(() => {
    const store = useContentUpdates.getState()
    void store.refresh(id)
    void store.check(id)
  }, [id])

  if (!inst) return <div className="flex h-full items-center justify-center text-content-secondary">This instance no longer exists.</div>

  return (
    <div className="relative flex h-full flex-col pr-3" data-testid="screen-instance">
      <span aria-hidden className="absolute bottom-[46px] right-[30px] top-[27px] w-1 rounded-full bg-surface-active" />
      <div className="shrink-0 pl-6 pr-6 pt-[27px]">
        <button
          onClick={() => canBack() ? back() : go({ name: 'library' })}
          className="mb-6 flex items-center gap-2 text-[15px] text-content-secondary transition-colors hover:text-accent"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <InstanceOverview inst={inst} />
      </div>

      <div className="mt-6 flex h-[42px] shrink-0 items-end border-b border-line-subtle px-6">
        {MAIN_TABS.map(({ id: tabId, label, icon: Icon }) => {
          const active = tab === tabId
          return (
            <button
              key={tabId}
              role="tab"
              aria-selected={active}
              onClick={() => go({ name: 'instance', id, tab: tabId })}
              className={cn(
                'relative flex h-[42px] items-center gap-2 px-4 text-[15px] transition-colors',
                active ? 'text-accent' : 'text-content-secondary hover:text-content-primary'
              )}
            >
              <Icon size={17} strokeWidth={1.8} />
              {label}
              {tabId === 'content' && updateCount > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] text-accent-contrast">{updateCount}</span>}
              {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />}
            </button>
          )
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <motion.div key={tab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="h-full">
          <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner size={24} /></div>}>
            {tab === 'content' && <ContentTab inst={inst} />}
            {tab === 'worlds' && <WorldsTab inst={inst} />}
            {tab === 'screenshots' && <ScreenshotsTab inst={inst} />}
            {tab === 'files' && <FilesTab inst={inst} />}
            {tab === 'logs' && <LogsTab inst={inst} />}
            {tab === 'options' && <OptionsTab inst={inst} />}
          </Suspense>
        </motion.div>
      </div>
    </div>
  )
}
