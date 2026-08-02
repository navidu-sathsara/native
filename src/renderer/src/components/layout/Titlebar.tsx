import { Bug, Heart, Minus, Square, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useInstances, useRunning } from '@/stores/data'
import { useNav } from '@/stores/nav'
import markUrl from '@/assets/icon.png'

/** Green running-game pill (design-system §4): name → logs, square → stop. */
function RunningChip(): React.JSX.Element | null {
  const running = useRunning((s) => s.running)
  const instances = useInstances((s) => s.instances)
  const { go } = useNav()
  if (running.length === 0) return null
  const current = running[running.length - 1]
  const inst = instances.find((i) => i.id === current.instanceId)
  return (
    <div className="no-drag mr-5 flex h-[26px] items-center gap-1.5 rounded-full border border-line-subtle bg-surface-raised pl-2.5 pr-1">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
      <button
        onClick={() => inst && go({ name: 'instance', id: inst.id, tab: 'logs' })}
        className="max-w-[180px] truncate text-[11.5px] font-semibold text-content-secondary transition-colors hover:text-content-primary"
      >
        {inst?.name ?? 'Running'}
        {running.length > 1 ? ` +${running.length - 1}` : ''}
      </button>
      <button
        aria-label="Stop game"
        title="Stop game"
        onClick={() => void window.native.instances.kill(current.instanceId)}
        className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-content-secondary transition-colors hover:bg-danger-tint hover:text-danger"
      >
        <Square size={9} fill="currentColor" />
      </button>
    </div>
  )
}

/**
 * Compact frameless chrome modelled after the reference launcher. Navigation
 * now lives in the left rail and inside each screen, leaving the titlebar calm.
 */
export function Titlebar(): React.JSX.Element {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    void window.native.window.isMaximized().then(setMaximized)
    return window.native.window.onMaximized(setMaximized)
  }, [])

  return (
    <header className="drag relative z-40 flex h-9 shrink-0 items-center bg-launcher-window pl-3">
      <div className="flex items-center gap-2 text-content-primary">
        <img
          src={markUrl}
          width={22}
          height={22}
          alt=""
          draggable={false}
          className="brand-mark object-contain"
        />
        <span className="text-[14px] font-bold tracking-[-0.02em]">Native {__APP_VERSION__}</span>
        <span className="rounded bg-accent-tint px-1.5 py-0.5 text-[10px] font-bold leading-none text-accent">
          Beta
        </span>
      </div>

      <div className="min-w-0 flex-1" />

      <RunningChip />

      <button
        className="no-drag mr-5 flex h-full items-center gap-2 text-[12px] font-semibold text-content-secondary transition-colors hover:text-accent"
        onClick={() => void window.native.app.openExternal('https://github.com/navidu-sathsara/native')}
      >
        <Bug size={15} />
        <span className="hidden min-[900px]:inline">Report a bug</span>
      </button>
      <button
        className="no-drag mr-5 flex h-full items-center gap-2 text-[12px] font-semibold text-content-secondary transition-colors hover:text-accent"
        onClick={() => void window.native.app.openExternal('https://github.com/sponsors/navidu-sathsara')}
      >
        <Heart size={15} />
        <span className="hidden min-[900px]:inline">Support Native</span>
      </button>

      <div className="no-drag flex h-full items-stretch">
        <button
          aria-label="Minimize"
          onClick={() => window.native.window.minimize()}
          className="flex w-[48px] items-center justify-center text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary"
        >
          <Minus size={15} strokeWidth={1.8} />
        </button>
        <button
          aria-label="Maximize"
          onClick={() => window.native.window.toggleMaximize()}
          className="flex w-[48px] items-center justify-center text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary"
        >
          {maximized ? (
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
              <rect x="1.5" y="4" width="8.5" height="8.5" rx="1.2" />
              <path d="M4.5 4V3A1.5 1.5 0 0 1 6 1.5h5A1.5 1.5 0 0 1 12.5 3v5A1.5 1.5 0 0 1 11 9.5h-1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden>
              <rect x="1.75" y="1.75" width="10.5" height="10.5" rx="1.5" />
            </svg>
          )}
        </button>
        <button
          aria-label="Close"
          onClick={() => window.native.window.close()}
          className="flex w-[48px] items-center justify-center text-content-secondary transition-colors hover:bg-[#c42b3b] hover:text-white"
        >
          <X size={15} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  )
}
