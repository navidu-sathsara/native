import {
  ArrowUpRight,
  Boxes,
  ChevronDown,
  Gamepad2,
  MessageCircle,
  Newspaper,
  Play,
  Radio,
  Sparkles
} from 'lucide-react'
import { useNews } from '@/stores/data'
import { useModals } from '@/stores/nav'
import { Spinner } from '@/components/ui/ui'

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(date)
    .toUpperCase()
}

function NewsPanel(): React.JSX.Element {
  const { items, loaded, error } = useNews()
  const openNews = useModals((s) => s.openNews)

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-[37px] shrink-0 items-center gap-2 border-b border-line-subtle px-4 text-[15px] font-bold text-content-primary">
        <Newspaper size={17} className="text-content-muted" />
        News
        <ChevronDown size={14} className="ml-auto text-content-muted" />
      </div>
      <div className="launcher-news-scroll min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {!loaded && <div className="flex justify-center py-8"><Spinner /></div>}
        {loaded && error && (
          <div className="flex flex-col items-center gap-2 py-7 text-center text-content-muted">
            <Newspaper size={27} />
            <p className="text-[12px]">News is unavailable right now.</p>
          </div>
        )}
        <div className="flex flex-col">
          {items.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => openNews(item.id)}
              className="group flex min-h-[80px] gap-3 rounded-[9px] p-1.5 text-left transition-colors hover:bg-surface-hover"
            >
              <div className="h-[59px] w-[80px] shrink-0 overflow-hidden rounded-[6px] border-[3px] border-accent/40 bg-accent-tint ring-1 ring-accent/60">
                {item.image ? (
                  <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent to-surface-inset text-accent-contrast"><Gamepad2 size={24} /></div>
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="line-clamp-2 text-[13px] font-bold leading-[17px] text-content-primary">{item.title}</div>
                <div className="mt-1 text-[9px] font-medium tracking-[0.06em] text-content-muted">{formatDate(item.date)}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => void window.native.app.openExternal('https://www.minecraft.net/en-us/community')}
          className="group mx-1 mt-6 block w-[calc(100%-8px)] rounded-[13px] border border-line-subtle bg-surface-raised p-4 pb-6 text-left transition-colors hover:bg-surface-hover"
        >
          <div className="flex items-center gap-3">
            <Sparkles size={21} className="text-accent" />
            <span className="font-serif text-[18px] font-bold text-content-primary">Native Hub</span>
            <span className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-surface-input text-content-secondary transition-colors group-hover:bg-accent group-hover:text-accent-contrast">
              <ArrowUpRight size={16} />
            </span>
          </div>
          <p className="mt-4 text-[12px] leading-[19px] text-content-secondary">
            Discover handy tools, manage your games and explore the latest Minecraft news, all in one place.
          </p>
        </button>
      </div>
    </section>
  )
}

export function RightSidebar(): React.JSX.Element {
  const links = [
    { icon: Boxes, label: 'Native' },
    { icon: MessageCircle, label: 'Community' },
    { icon: Radio, label: 'Updates' },
    { icon: Play, label: 'Videos' },
    { icon: Gamepad2, label: 'Games' }
  ]

  return (
    <aside className="hidden w-[304px] shrink-0 flex-col overflow-hidden rounded-[13px] border border-line-subtle bg-launcher-panel min-[1050px]:flex">
      <NewsPanel />
      <footer className="flex h-14 shrink-0 items-center justify-around border-t border-line-subtle px-3">
        {links.map(({ icon: Icon, label }) => (
          <button key={label} aria-label={label} title={label} className="flex h-9 w-9 items-center justify-center rounded-[8px] text-content-secondary transition-colors hover:bg-accent-tint hover:text-accent">
            <Icon size={19} strokeWidth={1.8} />
          </button>
        ))}
      </footer>
    </aside>
  )
}
