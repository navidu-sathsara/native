import { AnimatePresence, motion } from 'framer-motion'
import { LayoutGrid, List, Play, Plus, Search, Square } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { InstanceConfig, LoaderKind } from '@shared/types'
import { LOADER_LABELS } from '@shared/types'
import { useInstanceBusy, useInstances, useRunning, useToasts, toastError } from '@/stores/data'
import { useModals, useNav } from '@/stores/nav'
import { InstanceIcon } from '@/components/InstanceIcon'
import { LoaderMark } from '@/components/LoaderMark'
import { Button, Chip, EmptyState, IconButton, SearchInput, Spinner } from '@/components/ui/ui'
import { Select } from '@/components/ui/menu'
import { InstanceKebab } from '@/screens/Home'
import { cn, formatPlaytime, timeAgo } from '@/lib/util'

type SortKey = 'recent' | 'name' | 'played'

function InstanceCard({ inst }: { inst: InstanceConfig }): React.JSX.Element {
  const { go } = useNav()
  const running = useRunning((s) => s.isRunning(inst.id))
  const busy = useInstanceBusy(inst.id)
  const push = useToasts((s) => s.push)

  const launch = (): void => {
    if (busy) return
    push({ kind: 'info', title: `Launching ${inst.name}…` })
    window.native.instances.launch(inst.id).catch((err) => toastError(err, `Couldn't launch ${inst.name}`))
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 38 }}
      whileHover={{ y: -2 }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-line-subtle bg-surface-raised transition-all duration-fast hover:border-line-strong hover:bg-surface-hover"
      onClick={() => go({ name: 'instance', id: inst.id, tab: 'content' })}
      data-testid="instance-card"
    >
      <div className="relative flex items-center justify-center bg-surface-inset py-8">
        <InstanceIcon icon={inst.icon} name={inst.name} size={76} />
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 backdrop-blur-[2px] transition-opacity duration-fast group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            running ? void window.native.instances.kill(inst.id) : launch()
          }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-xl ring-2 ring-accent/30">
            {running ? <Square size={20} /> : busy ? <Spinner size={20} /> : <Play size={20} className="ml-0.5" />}
          </div>
        </div>
        {running && (
          <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="truncate text-[13px] font-bold leading-snug text-content-primary">{inst.name}</div>
        <div className="flex flex-wrap gap-1">
          <Chip>
            <LoaderMark loader={inst.loader} size={12} />
            {LOADER_LABELS[inst.loader]}
          </Chip>
          <Chip>{inst.mcVersion}</Chip>
        </div>
        <div className="mt-0.5 truncate text-[11px] leading-tight text-content-muted">
          {inst.totalPlayMs > 0 ? `${formatPlaytime(inst.totalPlayMs)} played` : 'Never played'}
          {inst.lastPlayedAt ? ` · ${timeAgo(inst.lastPlayedAt)}` : ''}
        </div>
      </div>

      <div
        className="absolute right-1.5 top-1.5 opacity-0 transition-opacity duration-fast group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <InstanceKebab inst={inst} />
      </div>
    </motion.div>
  )
}

function InstanceRow({ inst }: { inst: InstanceConfig }): React.JSX.Element {
  const { go } = useNav()
  const running = useRunning((s) => s.isRunning(inst.id))
  const busy = useInstanceBusy(inst.id)
  const push = useToasts((s) => s.push)
  const launch = (): void => {
    if (busy) return
    push({ kind: 'info', title: `Launching ${inst.name}…` })
    window.native.instances.launch(inst.id).catch((err) => toastError(err, `Couldn't launch ${inst.name}`))
  }
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 38 }}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-line-subtle bg-surface-raised px-4 py-3 transition-all duration-fast hover:border-line-strong hover:bg-surface-hover"
      onClick={() => go({ name: 'instance', id: inst.id, tab: 'content' })}
    >
      <InstanceIcon icon={inst.icon} name={inst.name} size={42} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-bold text-content-primary">{inst.name}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-content-secondary">
          <LoaderMark loader={inst.loader} size={12} />
          <span>{LOADER_LABELS[inst.loader]}</span>
          <span className="text-content-muted">·</span>
          <span>{inst.mcVersion}</span>
        </div>
      </div>
      <div className="text-[11px] text-content-muted">
        {inst.totalPlayMs > 0 ? formatPlaytime(inst.totalPlayMs) : '—'}
      </div>
      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
        <IconButton
          icon={running ? Square : Play}
          label={running ? 'Stop' : 'Play'}
          variant={running ? 'danger' : 'input'}
          onClick={() => (running ? void window.native.instances.kill(inst.id) : launch())}
        />
        <InstanceKebab inst={inst} />
      </div>
    </motion.div>
  )
}

export function LibraryScreen(): React.JSX.Element {
  const { instances, loaded } = useInstances()
  const setCreateOpen = useModals((s) => s.setCreateOpen)
  const [query, setQuery] = useState('')
  const [loader, setLoader] = useState<LoaderKind | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('recent')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const filtered = useMemo(() => {
    let list = instances
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.mcVersion.includes(q))
    }
    if (loader !== 'all') list = list.filter((i) => i.loader === loader)
    const sorted = [...list]
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'played') sorted.sort((a, b) => b.totalPlayMs - a.totalPlayMs)
    else sorted.sort((a, b) => (b.lastPlayedAt ?? b.createdAt) - (a.lastPlayedAt ?? a.createdAt))
    return sorted
  }, [instances, query, loader, sort])

  return (
    <div className="flex h-full flex-col" data-testid="screen-library">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-line-subtle px-6 py-5">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-content-primary">Library</h1>
          <p className="mt-0.5 text-[12px] text-content-muted">
            {instances.length === 0 ? 'No instances yet' : `${instances.length} instance${instances.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button icon={Plus} onClick={() => setCreateOpen(true)} data-testid="library-create">
          New instance
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-line-subtle px-6 py-3">
        <SearchInput
          placeholder="Search instances…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-56"
          data-testid="library-search"
        />
        <Select
          label="Loader"
          value={loader}
          onChange={setLoader}
          options={[
            { value: 'all', label: 'All loaders' },
            { value: 'vanilla', label: 'Vanilla' },
            { value: 'fabric', label: 'Fabric' },
            { value: 'quilt', label: 'Quilt' },
            { value: 'forge', label: 'Forge' },
            { value: 'neoforge', label: 'NeoForge' }
          ]}
        />
        <Select
          label="Sort"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'recent', label: 'Recently played' },
            { value: 'name', label: 'Name' },
            { value: 'played', label: 'Most played' }
          ]}
        />
        <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-line-subtle bg-surface-raised p-0.5">
          <button
            aria-label="Grid view"
            onClick={() => setView('grid')}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-fast',
              view === 'grid' ? 'bg-accent text-accent-contrast' : 'text-content-muted hover:text-content-primary'
            )}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            aria-label="List view"
            onClick={() => setView('list')}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-fast',
              view === 'list' ? 'bg-accent text-accent-contrast' : 'text-content-muted hover:text-content-primary'
            )}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {loaded && instances.length === 0 && (
          <EmptyState
            icon={Plus}
            title="Your library is empty"
            detail="Create an instance to install Minecraft with the loader and mods you want."
            action={<Button icon={Plus} onClick={() => setCreateOpen(true)}>Create instance</Button>}
          />
        )}
        {instances.length > 0 && filtered.length === 0 && (
          <EmptyState icon={Search} title="No matches" detail="Try a different search or filter." />
        )}
        <AnimatePresence mode="wait">
          {view === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="grid grid-cols-[repeat(auto-fill,minmax(172px,1fr))] gap-3"
            >
              {filtered.map((inst) => (
                <InstanceCard key={inst.id} inst={inst} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex flex-col gap-2"
            >
              {filtered.map((inst) => (
                <InstanceRow key={inst.id} inst={inst} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
