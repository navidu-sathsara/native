import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpCircle, Check, Download, ExternalLink, RefreshCw, Sparkles, X } from 'lucide-react'
import { useUpdater } from '@/stores/data'
import { Button, ProgressBar } from '@/components/ui/ui'
import { formatBytes, formatEta, formatSpeed } from '@/lib/util'

/** GitHub patch-update card: available -> patch -> verified -> restart. */
export function UpdateToast(): React.JSX.Element {
  const { state, dismissed, dismiss } = useUpdater()
  const visible =
    !dismissed &&
    (state.status === 'available' ||
      state.status === 'downloading' ||
      state.status === 'ready' ||
      state.status === 'manual' ||
      state.status === 'error')
  const version = visible && 'version' in state ? state.version : ''

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="fixed bottom-4 left-20 z-[70] w-[400px] overflow-hidden rounded-card border border-line-subtle bg-surface-raised shadow-modal"
          data-testid="update-toast"
        >
          <div className="relative flex items-center gap-3 bg-accent px-5 py-3.5 text-accent-contrast">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-contrast/15">
              {state.status === 'ready' ? (
                <Check size={19} />
              ) : state.status === 'downloading' ? (
                <Download size={18} />
              ) : state.status === 'manual' ? (
                <ExternalLink size={18} />
              ) : state.status === 'error' ? (
                <RefreshCw size={19} />
              ) : (
                <ArrowUpCircle size={19} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-body font-bold leading-tight">
                {state.status === 'ready'
                  ? `Native ${version} is ready`
                  : state.status === 'downloading'
                    ? `Patching Native to ${version}`
                    : state.status === 'manual'
                      ? `Native ${version} needs a manual update`
                      : state.status === 'error'
                        ? 'Update interrupted'
                        : 'A new GitHub release is available'}
              </div>
              <div className="text-tiny opacity-80">
                {state.status === 'ready'
                  ? 'Patch verified; restart when ready'
                  : state.status === 'downloading'
                    ? 'Downloading changed blocks only'
                    : state.status === 'manual'
                      ? 'The full setup was not downloaded'
                      : state.status === 'error'
                        ? 'Your current installation is unchanged'
                        : `GitHub tag ${state.tag} - patch update`}
              </div>
            </div>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="shrink-0 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-5 py-4">
            {state.status === 'available' && (
              <>
                {state.notes ? (
                  <div className="mb-4 flex gap-2.5 rounded-md2 bg-surface-inset p-3">
                    <Sparkles size={15} className="mt-0.5 shrink-0 text-accent" />
                    <div className="line-clamp-4 whitespace-pre-line text-small leading-relaxed text-content-secondary">
                      {sanitizeNotes(state.notes)}
                    </div>
                  </div>
                ) : (
                  <p className="mb-4 text-small text-content-secondary">
                    Native will fetch only the blocks that changed, then verify and reconstruct the
                    update locally.
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    icon={Download}
                    onClick={() => void window.native.updater.download()}
                    className="flex-1"
                  >
                    Download patch
                  </Button>
                  <Button size="sm" variant="secondary" onClick={dismiss}>Later</Button>
                </div>
              </>
            )}

            {state.status === 'downloading' && (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-h2 font-bold tabular-nums text-content-primary">
                    {Math.round(state.progress.percent)}%
                  </span>
                  <span className="text-tiny tabular-nums text-content-muted">
                    {formatSpeed(state.progress.bytesPerSecond)}
                    {state.progress.bytesPerSecond > 1 &&
                      ` - ${formatEta(
                        Math.round(
                          (state.progress.total - state.progress.transferred) /
                            Math.max(1, state.progress.bytesPerSecond)
                        )
                      )} left`}
                  </span>
                </div>
                <ProgressBar className="mt-2" value={state.progress.percent / 100} />
                <div className="mt-1.5 text-tiny tabular-nums text-content-muted">
                  {formatBytes(state.progress.transferred)} of {formatBytes(state.progress.total)} patch data
                </div>
              </>
            )}

            {state.status === 'ready' && (
              <>
                <p className="mb-4 text-small text-content-secondary">
                  The changed blocks were downloaded and verified. Restart now to use {version}, or
                  keep playing and install it when Native quits.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    icon={RefreshCw}
                    onClick={() => void window.native.updater.install()}
                    className="flex-1"
                  >
                    Restart now
                  </Button>
                  <Button size="sm" variant="secondary" onClick={dismiss}>On next launch</Button>
                </div>
              </>
            )}

            {state.status === 'manual' && (
              <>
                <p className="mb-2 text-small text-content-secondary">
                  Native refused to silently download the complete installer because a safe patch
                  could not be built for this installation.
                </p>
                <p className="mb-4 line-clamp-2 text-tiny text-content-muted">{state.reason}</p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    icon={ExternalLink}
                    onClick={() => void window.native.app.openExternal(state.releaseUrl)}
                    className="flex-1"
                  >
                    Open GitHub release
                  </Button>
                  <Button size="sm" variant="secondary" onClick={dismiss}>Later</Button>
                </div>
              </>
            )}

            {state.status === 'error' && (
              <>
                <p className="mb-4 text-small text-content-secondary">
                  {state.error}. Native kept the current version intact; check your connection and retry.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    icon={RefreshCw}
                    onClick={() => void window.native.updater.check()}
                    className="flex-1"
                  >
                    Retry
                  </Button>
                  <Button size="sm" variant="secondary" onClick={dismiss}>Dismiss</Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function sanitizeNotes(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent?.slice(0, 500) ?? ''
}
