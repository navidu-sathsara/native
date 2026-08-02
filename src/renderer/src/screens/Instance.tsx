import { lazy, Suspense, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Download,
  FolderOpen,
  Globe2,
  Image,
  Play,
  ScrollText,
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
  { id: 'files' as const, label: 'Files', icon: FolderOpen },
  { id: 'logs' as const, label: 'Logs', icon: ScrollText }
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
      <Button variant="danger" icon={Square} onClick={() => void window.native.instances.kill(inst.id)} className="h-11 min-w-[150px] rounded-full">
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
        className="h-11 min-w-[150px] rounded-full bg-gradient-to-r from-accent to-accent-hover text-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,.25)] hover:brightness-110"
      >
        {busy ? <Spinner size={16} /> : inst.installed ? 'Play' : 'Install'}
      </Button>
    </div>
  )
}

/** Compact Modrinth-style header: icon + identity on the left, actions on the right. */
function InstanceHeader({ inst, tab }: { inst: InstanceConfig; tab: InstanceTab }): React.JSX.Element {
  const { go, back, canBack } = useNav()
  return (
    <div className="flex items-center gap-4">
      <button
        aria-label="Back"
        onClick={() => canBack() ? back() : go({ name: 'library' })}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-subtle bg-surface-raised text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary"
      >
        <ArrowLeft size={16} />
      </button>
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] border border-line-subtle bg-surface-inset">
        <InstanceIcon icon={inst.icon} name={inst.name} size={44} className="!rounded-[8px]" />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[21px] font-extrabold leading-7 tracking-[-0.025em] text-content-primary">{inst.name}</h1>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-content-secondary">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <LoaderMark loader={inst.loader} size={13} />
            {LOADER_LABELS[inst.loader]} {inst.mcVersion}
          </span>
          {inst.loaderVersion && inst.loader !== 'vanilla' && (
            <span className="font-mono text-[11.5px] text-content-muted">{inst.loaderVersion}</span>
          )}
          <span className="text-content-muted">•</span>
          <span>{formatPlaytime(inst.totalPlayMs)} played</span>
          {!inst.installed && (
            <>
              <span className="text-content-muted">•</span>
              <span className="text-warn">Not installed</span>
            </>
          )}
        </div>
      </div>
      <LaunchButton inst={inst} />
      <button
        role="tab"
        aria-label="Options"
        aria-selected={tab === 'options'}
        title="Instance options"
        onClick={() => go({ name: 'instance', id: inst.id, tab: 'options' })}
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-subtle transition-colors',
          tab === 'options'
            ? 'bg-accent-tint text-accent'
            : 'bg-surface-raised text-content-secondary hover:bg-surface-hover hover:text-content-primary'
        )}
      >
        <Settings size={18} strokeWidth={1.8} />
      </button>
      <button
        aria-label="Open instance folder"
        title="Open instance folder"
        onClick={() => void window.native.instances.openFolder(inst.id)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-subtle bg-surface-raised text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary"
      >
        <FolderOpen size={18} strokeWidth={1.8} />
      </button>
    </div>
  )
}

export function InstanceScreen({ id, tab }: { id: string; tab: InstanceTab }): React.JSX.Element {
  const inst = useInstances((s) => s.byId(id))
  const { go } = useNav()
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
      <div className="shrink-0 pl-6 pr-6 pt-5">
        <InstanceHeader inst={inst} tab={tab} />

        <div role="tablist" className="mt-4 flex w-fit items-center gap-1 rounded-full border border-line-subtle bg-surface-raised p-1">
          {MAIN_TABS.map(({ id: tabId, label, icon: Icon }) => {
            const active = tab === tabId
            return (
              <button
                key={tabId}
                role="tab"
                aria-selected={active}
                onClick={() => go({ name: 'instance', id, tab: tabId })}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-full px-4 text-[13.5px] font-semibold transition-colors',
                  active
                    ? 'bg-accent text-accent-contrast'
                    : 'text-content-secondary hover:bg-surface-hover hover:text-content-primary'
                )}
              >
                <Icon size={16} strokeWidth={1.8} />
                {label}
                {tabId === 'content' && updateCount > 0 && (
                  <span className={cn(
                    'rounded-full px-1.5 text-[10px]',
                    active ? 'bg-accent-contrast/25 text-accent-contrast' : 'bg-accent text-accent-contrast'
                  )}>
                    {updateCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-hidden">
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
