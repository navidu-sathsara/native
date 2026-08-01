import {
  Archive,
  Box,
  Globe2,
  Grid2X2,
  LogIn,
  Plus,
  Settings,
  Shirt
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useNav, useModals, type Route } from '@/stores/nav'
import { useAccounts, useInstances, useRunning } from '@/stores/data'
import { InstanceIcon } from '@/components/InstanceIcon'
import { PlayerHead } from '@/components/PlayerHead'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/util'

function RailButton({
  icon: Icon,
  label,
  active,
  onClick,
  children,
  tour
}: {
  icon?: LucideIcon
  label: string
  active?: boolean
  onClick: () => void
  children?: React.ReactNode
  tour?: string
}): React.JSX.Element {
  return (
    <Tooltip label={label} side="right">
      <motion.button
        whileTap={{ scale: 0.9 }}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        data-tour={tour}
        onClick={onClick}
        className={cn(
          'relative flex h-[42px] w-[52px] shrink-0 items-center justify-center rounded-[10px] transition-colors duration-fast',
          active
            ? 'bg-accent-tint text-accent'
            : 'text-content-secondary hover:bg-surface-hover hover:text-content-primary'
        )}
      >
        {active && <span className="absolute -left-[14px] h-5 w-0.5 rounded-r bg-launcher-accent" />}
        {children ?? (Icon ? <Icon size={22} strokeWidth={1.8} /> : null)}
      </motion.button>
    </Tooltip>
  )
}

export function Rail(): React.JSX.Element {
  const { route, go } = useNav()
  const { setSettingsOpen, setCreateOpen, setAccountsOpen } = useModals()
  const instances = useInstances((s) => s.instances)
  const running = useRunning((s) => s.running)
  const accounts = useAccounts((s) => s.accounts)
  const activeAccount = accounts.find((a) => a.active)
  const pinned = useMemo(() => instances.slice(0, 5), [instances])
  const is = (name: Route['name']): boolean => route.name === name

  return (
    <aside className="flex w-20 shrink-0 flex-col items-center overflow-hidden rounded-[13px] border border-line-subtle bg-launcher-panel py-2">
      <Tooltip label={activeAccount ? `Accounts — ${activeAccount.username}` : 'Sign in'} side="right">
        <button
          aria-label={activeAccount ? `Accounts — ${activeAccount.username}` : 'Sign in'}
          onClick={() => setAccountsOpen(true)}
          className="my-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-[9px] bg-surface-input text-content-secondary ring-1 ring-line-subtle transition-transform hover:scale-[1.03]"
        >
          {activeAccount ? <PlayerHead account={activeAccount} size={40} /> : <LogIn size={22} />}
        </button>
      </Tooltip>

      <div className="mb-1 h-px w-10 bg-line-subtle" />
      <div className="flex flex-col gap-[9px] pt-[9px]">
        <RailButton icon={Grid2X2} label="Home" tour="home" active={is('home')} onClick={() => go({ name: 'home' })} />
        <RailButton icon={Box} label="Library" tour="library" active={is('library')} onClick={() => go({ name: 'library' })} />
        <RailButton
          icon={Globe2}
          label="Discover content"
          tour="discover"
          active={route.name === 'discover'}
          onClick={() => go({ name: 'discover' })}
        />
        <RailButton icon={Shirt} label="Skins" onClick={() => setAccountsOpen(true)} />
        <RailButton icon={Archive} label="Servers" tour="servers" active={is('servers')} onClick={() => go({ name: 'servers' })} />
      </div>

      <div className="my-[10px] h-px w-10 bg-line-subtle" />
      <RailButton icon={Plus} label="Create instance" tour="create" onClick={() => setCreateOpen(true)} />

      <div className="scrollbar-none flex min-h-0 flex-1 flex-col items-center gap-2 self-stretch overflow-y-auto py-1.5">
        {pinned.map((inst) => {
          const isRunning = running.some((r) => r.instanceId === inst.id)
          const activeInst = route.name === 'instance' && route.id === inst.id
          return (
            <Tooltip key={inst.id} label={isRunning ? `${inst.name} — running` : inst.name} side="right">
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.93 }}
                aria-label={inst.name}
                onClick={() => go({ name: 'instance', id: inst.id, tab: 'content' })}
                className={cn(
                  'relative shrink-0 rounded-[9px] p-0.5',
                  activeInst && 'bg-accent ring-1 ring-accent-hover'
                )}
              >
                <InstanceIcon icon={inst.icon} name={inst.name} size={40} className="!rounded-[8px]" />
                {isRunning && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-launcher-panel bg-accent" />}
              </motion.button>
            </Tooltip>
          )
        })}
      </div>

      <div className="mb-2 h-px w-14 bg-line-subtle" />
      <RailButton icon={Settings} label="Settings" tour="settings" onClick={() => setSettingsOpen(true)} />
    </aside>
  )
}
