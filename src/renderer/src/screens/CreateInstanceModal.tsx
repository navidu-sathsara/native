import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, FileUp, ImagePlus, Package, Search } from 'lucide-react'
import type { LoaderKind } from '@shared/types'
import { LOADER_LABELS } from '@shared/types'
import { useModals, useNav } from '@/stores/nav'
import { useInstances, useManifest, useToasts, toastError } from '@/stores/data'
import { Modal, FieldLabel } from '@/components/ui/modal'
import { Button, Input, SearchInput, Spinner, Toggle } from '@/components/ui/ui'
import { InstanceIcon } from '@/components/InstanceIcon'
import { MINECRAFT_BLOCKS, MinecraftBlockIcon } from '@/components/MinecraftBlockIcon'
import { LoaderMark } from '@/components/LoaderMark'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/util'

const LOADERS: LoaderKind[] = ['vanilla', 'fabric', 'quilt', 'forge', 'neoforge']

/**
 * Custom expandable version select — a pill trigger that unfolds into a
 * searchable listbox in place (no native <select> anywhere).
 */
function VersionSelect({
  value,
  onChange,
  versions,
  loading,
  showSnapshots,
  onToggleSnapshots
}: {
  value: string
  onChange: (v: string) => void
  versions: { id: string; type: string }[]
  loading: boolean
  showSnapshots: boolean
  onToggleSnapshots: (v: boolean) => void
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(
    () => versions.filter((v) => v.id.toLowerCase().includes(query.toLowerCase())).slice(0, 300),
    [versions, query]
  )

  // Keep the selected row in view when the list opens.
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector('[data-selected="true"]')
    el?.scrollIntoView({ block: 'center' })
  }, [open])

  return (
    <div className="overflow-hidden rounded-md2 border border-line-subtle bg-surface-base">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        data-testid="version-select"
        className="flex h-11 w-full items-center justify-between px-4 text-body transition-colors duration-fast hover:bg-surface-hover"
      >
        <span className="font-semibold text-content-primary">{value || 'Pick a version'}</span>
        <span className="flex items-center gap-2 text-content-secondary">
          {loading && <Spinner size={13} />}
          <ChevronDown
            size={16}
            className={cn('transition-transform duration-base', open && 'rotate-180')}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden border-t border-line-subtle"
          >
            <div className="flex items-center gap-3 p-2.5">
              <SearchInput
                placeholder="Filter versions"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 [&>input]:h-9"
              />
              <label className="flex shrink-0 cursor-pointer items-center gap-2 pr-1 text-small text-content-secondary">
                Snapshots
                <Toggle checked={showSnapshots} onChange={onToggleSnapshots} label="Show snapshots" />
              </label>
            </div>
            <div ref={listRef} className="max-h-44 overflow-y-auto px-1.5 pb-1.5">
              {filtered.map((v) => {
                const selected = value === v.id
                return (
                  <button
                    key={v.id}
                    type="button"
                    data-selected={selected}
                    onClick={() => {
                      onChange(v.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-sm2 px-3 py-1.5 text-left text-body transition-colors duration-fast',
                      selected
                        ? 'bg-accent font-semibold text-accent-contrast'
                        : 'text-content-primary hover:bg-surface-hover'
                    )}
                  >
                    <span>{v.id}</span>
                    <span className="flex items-center gap-2">
                      {v.type !== 'release' && (
                        <span
                          className={cn(
                            'text-tiny capitalize',
                            selected ? 'text-accent-contrast/75' : 'text-content-muted'
                          )}
                        >
                          {v.type.replace('old_', '')}
                        </span>
                      )}
                      {selected && <Check size={14} strokeWidth={3} />}
                    </span>
                  </button>
                )
              })}
              {!loading && filtered.length === 0 && (
                <div className="flex items-center gap-2 px-3 py-3 text-small text-content-muted">
                  <Search size={15} /> No versions match “{query}”.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Segmented loader-version choice: Stable / Latest / concrete builds. */
function LoaderVersionPicker({
  loader,
  versions,
  value,
  onChange
}: {
  loader: LoaderKind
  versions: { version: string; stable: boolean }[] | null
  value: string
  onChange: (v: string) => void
}): React.JSX.Element {
  if (versions === null) {
    return (
      <div className="flex h-10 items-center gap-2 text-small text-content-secondary">
        <Spinner size={14} /> Fetching {LOADER_LABELS[loader]} builds…
      </div>
    )
  }
  if (versions.length === 0) {
    return (
      <p className="text-small text-danger">
        No {LOADER_LABELS[loader]} builds for this Minecraft version — try another.
      </p>
    )
  }
  const options = ['stable', 'latest', ...versions.slice(0, 5).map((v) => v.version)].filter(
    (v, i, a) => a.indexOf(v) === i
  )
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((v) => {
        const selected = value === v
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              'h-9 rounded-full border px-4 text-small font-semibold capitalize transition-colors duration-fast',
              selected
                ? 'border-accent bg-accent text-accent-contrast'
                : 'border-line-subtle bg-surface-base text-content-secondary hover:border-line-strong hover:text-content-primary'
            )}
          >
            {v}
          </button>
        )
      })}
    </div>
  )
}

export function CreateInstanceModal(): React.JSX.Element {
  const open = useModals((s) => s.createOpen)
  const setOpen = useModals((s) => s.setCreateOpen)
  const { go } = useNav()
  const refresh = useInstances((s) => s.refresh)
  const push = useToasts((s) => s.push)
  const { manifest, load } = useManifest()

  const [name, setName] = useState('')
  const [nameEdited, setNameEdited] = useState(false)
  const [loader, setLoader] = useState<LoaderKind>('fabric')
  const [mcVersion, setMcVersion] = useState('')
  const [icon, setIcon] = useState('block:grass')
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [loaderVersions, setLoaderVersions] = useState<{ version: string; stable: boolean }[] | null>(null)
  const [loaderVersion, setLoaderVersion] = useState<string>('stable')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open && !manifest) void load()
  }, [open, manifest, load])

  useEffect(() => {
    if (open && manifest && !mcVersion) setMcVersion(manifest.latest.release)
  }, [open, manifest, mcVersion])

  // Auto-suggest a name from loader + version until the user types their own.
  useEffect(() => {
    if (!nameEdited && mcVersion) setName(`${LOADER_LABELS[loader]} ${mcVersion}`)
  }, [loader, mcVersion, nameEdited])

  // Fetch loader versions when loader/mc changes.
  useEffect(() => {
    if (!open || loader === 'vanilla' || !mcVersion) {
      setLoaderVersions(null)
      return
    }
    let cancelled = false
    setLoaderVersions(null)
    setLoaderVersion('stable')
    window.native.versions
      .loaderVersions(loader, mcVersion)
      .then((v) => !cancelled && setLoaderVersions(v))
      .catch(() => !cancelled && setLoaderVersions([]))
    return () => {
      cancelled = true
    }
  }, [open, loader, mcVersion])

  const versions = useMemo(() => {
    if (!manifest) return []
    return manifest.versions.filter((v) => (showSnapshots ? true : v.type === 'release'))
  }, [manifest, showSnapshots])

  const reset = (): void => {
    setName('')
    setNameEdited(false)
    setLoader('fabric')
    setMcVersion(manifest?.latest.release ?? '')
    setIcon('block:grass')
    setLoaderVersion('stable')
  }

  const pickImage = async (): Promise<void> => {
    try {
      const ref = await window.native.icons.importImage()
      if (ref) setIcon(ref)
    } catch (err) {
      toastError(err, "Couldn't use that image")
    }
  }

  // Import a local Modrinth pack — works offline for packs whose content
  // ships in overrides; packs with a download list need the network.
  const importPack = async (): Promise<void> => {
    const picked = await window.native.app.pickFile({
      title: 'Import a Modrinth modpack',
      filters: [{ name: 'Modrinth modpack', extensions: ['mrpack'] }]
    })
    if (picked.length === 0) return
    setBusy(true)
    try {
      push({ kind: 'info', title: 'Importing modpack…' })
      const res = await window.native.packs.importFile(picked[0])
      await refresh()
      setOpen(false)
      reset()
      push({
        kind: 'success',
        title: `Imported ${res.instance.name}`,
        detail: res.warnings[0] ?? undefined
      })
      go({ name: 'instance', id: res.instance.id, tab: 'content' })
    } catch (err) {
      toastError(err, "Couldn't import modpack")
    } finally {
      setBusy(false)
    }
  }

  const create = async (): Promise<void> => {
    if (!name.trim() || !mcVersion) return
    setBusy(true)
    try {
      const inst = await window.native.instances.create({
        name: name.trim(),
        mcVersion,
        loader,
        loaderVersion: loader === 'vanilla' ? null : loaderVersion,
        icon
      })
      await refresh()
      setOpen(false)
      reset()
      push({ kind: 'success', title: `Created ${inst.name}`, detail: 'Installing game files…' })
      go({ name: 'instance', id: inst.id, tab: 'content' })
      window.native.instances
        .install(inst.id)
        .then(() => push({ kind: 'success', title: `${inst.name} is ready to play` }))
        .catch((err) => toastError(err, `Install failed for ${inst.name}`))
    } catch (err) {
      toastError(err, "Couldn't create instance")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      width={640}
      title="Create new instance"
      titleIcon={<Package size={22} className="text-accent" />}
      bodyClassName="p-0"
      footer={
        <>
          <Button
            variant="ghost"
            icon={FileUp}
            onClick={() => void importPack()}
            disabled={busy}
            className="mr-auto"
            data-testid="import-mrpack"
          >
            Import .mrpack
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={create}
            disabled={busy || !name.trim() || !mcVersion}
            icon={busy ? undefined : Check}
            data-testid="create-confirm"
          >
            {busy ? <Spinner size={16} /> : 'Create'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 p-6">
        {/* Name + live icon preview */}
        <div className="flex items-end gap-4">
          <InstanceIcon icon={icon} name={name || 'New'} size={72} />
          <div className="flex-1">
            <FieldLabel>Instance name</FieldLabel>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameEdited(true)
              }}
              placeholder="My instance"
              data-testid="create-name"
              autoFocus
            />
          </div>
        </div>

        {/* SKlauncher-style Minecraft block palette. */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <FieldLabel className="mb-0">Instance icon</FieldLabel>
            <span className="text-small font-medium text-content-secondary">
              {icon.startsWith('image:')
                ? 'Custom image'
                : MINECRAFT_BLOCKS.find((block) => icon === `block:${block.id}`)?.name}
            </span>
          </div>
          <div className="grid grid-cols-8 gap-2 rounded-md2 border border-line-subtle bg-surface-base p-3" role="radiogroup" aria-label="Instance block or custom image">
            <Tooltip label="Upload custom image" side="top">
              <button
                type="button"
                role="radio"
                aria-checked={icon.startsWith('image:')}
                aria-label="Upload custom image"
                onClick={() => void pickImage()}
                data-testid="icon-upload"
                className={cn(
                  'group relative flex aspect-square min-w-0 items-center justify-center overflow-hidden rounded-[10px] border border-dashed transition-all duration-fast',
                  icon.startsWith('image:')
                    ? 'border-accent bg-accent-tint shadow-[0_0_0_2px_var(--accent)]'
                    : 'border-line-strong bg-surface-raised text-content-secondary hover:border-accent hover:bg-surface-hover hover:text-accent'
                )}
              >
                {icon.startsWith('image:') ? (
                  <InstanceIcon icon={icon} name={name || 'New'} size={48} className="!rounded-[7px]" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <ImagePlus size={20} strokeWidth={1.8} />
                    <span className="text-[9px] font-bold uppercase tracking-wide">Upload</span>
                  </div>
                )}
                {icon.startsWith('image:') && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-sm">
                    <Check size={10} strokeWidth={3.5} />
                  </span>
                )}
              </button>
            </Tooltip>
            {MINECRAFT_BLOCKS.map((block) => {
              const selected = icon === `block:${block.id}`
              return (
                <Tooltip key={block.id} label={block.name} side="top">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={block.name}
                    onClick={() => setIcon(`block:${block.id}`)}
                    data-testid={`block-picker-${block.id}`}
                    className={cn(
                      'group relative flex aspect-square min-w-0 items-center justify-center rounded-[10px] border transition-all duration-fast',
                      selected
                        ? 'border-accent bg-accent-tint shadow-[0_0_0_2px_var(--accent)]'
                        : 'border-transparent bg-surface-raised hover:border-line-strong hover:bg-surface-hover'
                    )}
                  >
                    <MinecraftBlockIcon
                      block={block}
                      size={44}
                      className="transition-transform duration-fast group-hover:-translate-y-0.5 group-hover:scale-105"
                    />
                    {selected && (
                      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-sm">
                        <Check size={10} strokeWidth={3.5} />
                      </span>
                    )}
                  </button>
                </Tooltip>
              )
            })}
          </div>
        </div>

        {/* Loader — custom marks, radio-card row */}
        <div>
          <FieldLabel>Mod loader</FieldLabel>
          <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Mod loader">
            {LOADERS.map((l) => {
              const selected = loader === l
              return (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setLoader(l)}
                  data-testid={`loader-${l}`}
                  className={cn(
                    'relative flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-md2 border-[1.5px] text-small font-semibold transition-colors duration-fast',
                    selected
                      ? 'border-accent bg-accent-tint text-content-primary'
                      : 'border-transparent bg-surface-raised text-content-secondary hover:bg-surface-hover hover:text-content-primary'
                  )}
                >
                  {selected && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent"
                    >
                      <Check size={11} className="text-accent-contrast" strokeWidth={3} />
                    </motion.span>
                  )}
                  <LoaderMark loader={l} size={24} className={selected ? 'text-accent' : ''} />
                  {LOADER_LABELS[l]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Loader version */}
        {loader !== 'vanilla' && (
          <div>
            <FieldLabel>{LOADER_LABELS[loader]} version</FieldLabel>
            <LoaderVersionPicker
              loader={loader}
              versions={loaderVersions}
              value={loaderVersion}
              onChange={setLoaderVersion}
            />
          </div>
        )}

        {/* Minecraft version — custom expandable listbox */}
        <div>
          <FieldLabel>Minecraft version</FieldLabel>
          {!manifest ? (
            <div className="flex h-11 items-center gap-2 text-small text-content-secondary">
              <Spinner size={14} /> Loading versions…
            </div>
          ) : (
            <VersionSelect
              value={mcVersion}
              onChange={setMcVersion}
              versions={versions}
              loading={!manifest}
              showSnapshots={showSnapshots}
              onToggleSnapshots={setShowSnapshots}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}
