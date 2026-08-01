import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  Braces,
  Box,
  CircleArrowUp,
  FileUp,
  Package,
  Palette,
  PlusCircle,
  Puzzle,
  RefreshCw,
  Search,
  Sparkles,
  Trash2
} from 'lucide-react'
import type { ContentKind, InstanceConfig, LocalContentFile } from '@shared/types'
import { useContentUpdates, useToasts, useUpdateCount, toastError } from '@/stores/data'
import { useModals, useNav } from '@/stores/nav'
import { Button, IconButton, Spinner, Toggle } from '@/components/ui/ui'
import { Tooltip } from '@/components/ui/tooltip'
import { formatBytes } from '@/lib/util'

const KIND_TABS = [
  { id: 'mod' as const, label: 'Mods', icon: Puzzle },
  { id: 'resourcepack' as const, label: 'Resource Packs', icon: Box },
  { id: 'shaderpack' as const, label: 'Shaders', icon: Sparkles }
]

const KIND_FILTERS: Record<ContentKind, { name: string; extensions: string[] }[]> = {
  mod: [{ name: 'Mod', extensions: ['jar'] }],
  resourcepack: [{ name: 'Resource pack', extensions: ['zip'] }],
  shaderpack: [{ name: 'Shader pack', extensions: ['zip'] }]
}

function ContentRow({
  file,
  onToggle,
  onDelete,
  onOpen,
  onUpdate,
  updating
}: {
  file: LocalContentFile
  onToggle: (v: boolean) => void
  onDelete: () => void
  onOpen: (() => void) | null
  onUpdate: (() => void) | null
  updating: boolean
}): React.JSX.Element {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      className="group flex items-center gap-3 rounded-md2 bg-surface-raised px-4 py-3 transition-colors duration-fast hover:bg-surface-hover"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-sm2 bg-surface-inset text-content-secondary">
        {file.icon ? (
          <img
            src={file.icon}
            alt=""
            className={`h-full w-full object-cover ${file.enabled ? '' : 'opacity-40 grayscale'}`}
          />
        ) : (
          <Package size={18} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            onClick={onOpen ?? undefined}
            className={`truncate text-body font-semibold ${file.enabled ? 'text-content-primary' : 'text-content-muted line-through'} ${onOpen ? 'cursor-pointer hover:text-accent hover:underline' : ''}`}
          >
            {file.meta?.name ?? file.fileName}
          </span>
          {file.meta?.version && (
            <span className="shrink-0 text-tiny text-content-muted">{file.meta.version}</span>
          )}
        </div>
        <div className="truncate text-tiny text-content-muted">
          {file.fileName} · {formatBytes(file.sizeBytes)}
        </div>
      </div>
      {file.update && onUpdate && (
        <Tooltip
          label={`${file.meta?.version ?? 'installed'} → ${file.update.versionNumber}`}
          side="top"
        >
          <Button
            size="sm"
            icon={updating ? undefined : CircleArrowUp}
            onClick={onUpdate}
            disabled={updating}
            data-testid={`update-${file.fileName}`}
          >
            {updating ? <Spinner size={14} /> : 'Update'}
          </Button>
        </Tooltip>
      )}
      <Toggle checked={file.enabled} onChange={onToggle} label={`Enable ${file.fileName}`} />
      <button
        aria-label={`Delete ${file.fileName}`}
        onClick={onDelete}
        className="flex h-8 w-8 items-center justify-center rounded-full text-content-muted opacity-0 transition-all duration-fast hover:bg-danger hover:text-white group-hover:opacity-100"
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  )
}

export function ContentTab({ inst }: { inst: InstanceConfig }): React.JSX.Element {
  const [kind, setKind] = useState<ContentKind>('mod')
  const [query, setQuery] = useState('')
  const [files, setFiles] = useState<LocalContentFile[] | null>(null)
  const [checking, setChecking] = useState(false)
  const [updatingAll, setUpdatingAll] = useState(false)
  const [updatingFiles, setUpdatingFiles] = useState<Set<string>>(new Set())
  const updateCount = useUpdateCount(inst.id)
  const { go } = useNav()
  const openProject = useModals((s) => s.openProject)
  const push = useToasts((s) => s.push)
  const scrollRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      setFiles(await window.native.content.listLocal(inst.id, kind))
    } catch (err) {
      toastError(err)
      setFiles([])
    }
  }, [inst.id, kind])

  useEffect(() => {
    setFiles(null)
    void load()
  }, [load])

  // Installs/updates/removals elsewhere (Discover, project modal, updater)
  // land here live.
  useEffect(() => {
    return window.native.content.onLocalChanged((id) => {
      if (id === inst.id) void load()
    })
  }, [inst.id, load])

  const checkNow = async (): Promise<void> => {
    setChecking(true)
    try {
      const res = await useContentUpdates.getState().check(inst.id, { force: true })
      if (res?.fromCache) {
        push({
          kind: 'info',
          title: "Couldn't reach the update servers",
          detail: 'Showing the last known results.'
        })
      } else if (res && res.updates.length === 0) {
        push({ kind: 'success', title: 'Everything is up to date' })
      }
      await load()
    } finally {
      setChecking(false)
    }
  }

  const updateOne = async (file: LocalContentFile): Promise<void> => {
    setUpdatingFiles((s) => new Set(s).add(file.fileName))
    try {
      await window.native.content.applyUpdate(inst.id, kind, file.fileName)
      push({ kind: 'success', title: `Updated ${file.meta?.name ?? file.fileName}` })
    } catch (err) {
      toastError(err, `Couldn't update ${file.meta?.name ?? file.fileName}`)
    } finally {
      setUpdatingFiles((s) => {
        const next = new Set(s)
        next.delete(file.fileName)
        return next
      })
    }
  }

  const updateAllNow = async (): Promise<void> => {
    setUpdatingAll(true)
    try {
      const res = await window.native.content.updateAll(inst.id)
      if (res.failed.length > 0) {
        push({
          kind: 'error',
          title: `Updated ${res.applied}, ${res.failed.length} failed`,
          detail: res.failed.map((f) => f.fileName).join(', ')
        })
      } else if (res.applied > 0) {
        push({ kind: 'success', title: `Updated ${res.applied} item${res.applied === 1 ? '' : 's'}` })
      }
    } catch (err) {
      toastError(err, "Couldn't update content")
    } finally {
      setUpdatingAll(false)
    }
  }

  const rows = files ?? []
  const visibleRows = query.trim()
    ? rows.filter((file) => `${file.meta?.name ?? ''} ${file.fileName}`.toLowerCase().includes(query.trim().toLowerCase()))
    : rows
  const virtualizer = useVirtualizer({
    count: visibleRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 68,
    overscan: 8
  })

  const addFromDisk = async (): Promise<void> => {
    const picked = await window.native.app.pickFile({
      title: `Add ${kind}`,
      filters: KIND_FILTERS[kind],
      multi: true
    })
    if (picked.length === 0) return
    const n = await window.native.content.addLocalFiles(inst.id, kind, picked)
    push({ kind: 'success', title: `Added ${n} file${n === 1 ? '' : 's'}` })
    void load()
  }

  const kindLabel = KIND_TABS.find((item) => item.id === kind)!.label.toLowerCase()

  return (
    <div className="flex h-full flex-col px-6 pb-6 pt-6">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-[34px] shrink-0 items-center rounded-[8px] bg-surface-inset p-0.5">
          {KIND_TABS.map(({ id, label, icon: Icon }) => {
            const active = kind === id
            return (
              <button
                key={id}
                onClick={() => { setKind(id); setQuery('') }}
                className={`flex h-[30px] items-center gap-1.5 rounded-[7px] px-3 text-[11px] font-semibold transition-colors ${active ? 'border border-accent/50 bg-accent-tint text-accent' : 'text-content-muted hover:bg-surface-hover hover:text-content-primary'}`}
              >
                <Icon size={14} strokeWidth={1.8} /> {label}
              </button>
            )
          })}
          <button disabled title="Data packs are managed per-world" className="flex h-[30px] items-center gap-1.5 px-3 text-[11px] font-medium text-content-muted opacity-70">
            <Braces size={14} /> Data Packs
          </button>
        </div>

        <label className="relative min-w-[150px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search installed ${kindLabel}`}
            className="h-[34px] w-full rounded-[8px] border border-line-subtle bg-surface-inset pl-9 pr-3 text-[12px] text-content-primary outline-none placeholder:text-content-muted focus:border-accent"
          />
        </label>

        <div className="flex shrink-0 items-center gap-2">
          {updateCount > 0 && (
            <Button
              size="sm"
              icon={updatingAll ? undefined : CircleArrowUp}
              onClick={updateAllNow}
              disabled={updatingAll}
              data-testid="content-update-all"
            >
              {updatingAll ? <Spinner size={14} /> : `Update all (${updateCount})`}
            </Button>
          )}
          <Tooltip label="Check for updates" side="top">
            <IconButton
              icon={RefreshCw}
              label="Check for updates"
              onClick={() => void checkNow()}
              size={34}
              className={`rounded-[8px] border border-line-subtle bg-surface-input ${checking ? 'animate-spin' : ''}`}
              data-testid="content-check-updates"
            />
          </Tooltip>
          <Button
            size="sm"
            icon={FileUp}
            onClick={() => void addFromDisk().catch(toastError)}
            className="h-[34px] rounded-[8px] bg-gradient-to-r from-accent to-accent-hover px-3 text-[12px]"
          >
            Add
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className={`mt-3 min-h-0 flex-1 rounded-[12px] border border-line-subtle bg-surface-raised ${visibleRows.length > 0 ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {files === null && (
          <div className="flex h-full items-center justify-center">
            <Spinner size={24} />
          </div>
        )}
        {files && visibleRows.length === 0 && (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[17px] bg-accent-tint text-accent">
              {query ? <Search size={20} /> : <Palette size={20} />}
            </div>
            <div className="text-[13px] font-bold text-content-primary">
              {query ? 'No matching content' : `No ${kindLabel} installed`}
            </div>
            <div className="mt-1 text-[12px] text-content-secondary">
              {query ? 'Try a different search term' : `This instance has no ${kindLabel} installed yet`}
            </div>
            {!query && (
              <Button
                variant="secondary"
                icon={PlusCircle}
                onClick={() => go({ name: 'discover', instanceId: inst.id })}
                data-testid="content-discover"
                className="mt-4 h-8 rounded-[8px] border border-line-strong bg-transparent px-3 text-[11px] text-content-secondary hover:border-accent hover:text-accent"
              >
                Browse {kindLabel}
              </Button>
            )}
          </div>
        )}
        {files && visibleRows.length > 0 && (
          <div style={{ height: virtualizer.getTotalSize() + 16, position: 'relative' }}>
            <AnimatePresence initial={false}>
              {virtualizer.getVirtualItems().map((vi) => {
                const file = visibleRows[vi.index]
                return (
                  <div
                    key={file.fileName}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 8,
                      right: 8,
                      transform: `translateY(${vi.start + 8}px)`,
                      paddingBottom: 8
                    }}
                    ref={virtualizer.measureElement}
                    data-index={vi.index}
                  >
                    <ContentRow
                      file={file}
                      onUpdate={file.update ? () => void updateOne(file) : null}
                      updating={updatingFiles.has(file.fileName)}
                      onOpen={
                        file.meta?.projectId
                          ? () =>
                              openProject({
                                platform: file.meta?.platform ?? 'modrinth',
                                projectId: file.meta!.projectId!,
                                instanceId: inst.id
                              })
                          : null
                      }
                      onToggle={(v) => {
                        setFiles((prev) =>
                          prev!.map((f) => (f.fileName === file.fileName ? { ...f, enabled: v } : f))
                        )
                        window.native.content
                          .toggle(inst.id, kind, file.fileName, v)
                          .catch((err) => {
                            toastError(err)
                            void load()
                          })
                      }}
                      onDelete={() => {
                        if (!window.confirm(`Delete ${file.fileName}?`)) return
                        setFiles((prev) => prev!.filter((f) => f.fileName !== file.fileName))
                        window.native.content
                          .removeLocal(inst.id, kind, file.fileName)
                          .catch((err) => {
                            toastError(err)
                            void load()
                          })
                      }}
                    />
                  </div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
